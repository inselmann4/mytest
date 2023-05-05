const _ = require('lodash');
const passport = require('passport');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const Image = require('../../media/components/image');

const SYSTEM_CONST = require('../../system/constants');
const UserDto = require('../dtos/user.dto');

/**
 * Create a new user
 * Using by Administrator
 */
exports.create = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      username: Joi.string().required(),
      phoneNumber: Joi.string().allow(null, '').optional(),
      role: Joi.string().valid('admin', 'user').default('user').required(),
      type: Joi.string().valid('user', 'model').default('user').required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      balance: Joi.number().min(0).allow(null).optional(),
      address: Joi.string().allow(null, '').optional(),
      state: Joi.string().allow(null, '').optional(),
      city: Joi.string().allow(null, '').optional(),
      country: Joi.string().allow(null, '').optional(),
      isActive: Joi.boolean().allow(null).default(true).optional(),
      avatar: Joi.string().allow(null, '').optional(),
      emailVerified: Joi.boolean().allow(null).default(true).optional(),
      isCompletedProfile: Joi.boolean().allow(null).default(true).optional(),
      isBlocked: Joi.boolean().allow(null).default(true).optional(),
      isApproved: Joi.boolean().allow(null).default(false).optional()
    });

    const validate = schema.validate(req.body);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    if (validate.value.role === 'admin' && !validate.value.password) {
      return next(
        PopulateResponse.validationError({ msg: 'Das Admin-Konto benötigt ein Passwort, um sich anzumelden, bitte geben Sie das Passwort ein!' })
      );
    }

    const user = await Service.User.create(validate.value);
    res.locals.user = user;
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * do update for admin update
 */
exports.update = async (req, res, next) => {
  try {
    const user = req.params.id ? await DB.User.findOne({ _id: req.params.id }) : req.user;
    let publicFields = ['address', 'phoneNumber', 'isActive', 'avatar', 'email', 'isBlocked'];
    if (req.user.role === 'admin') {
      publicFields = publicFields.concat(['isCompletedProfile', 'emailVerified', 'role', 'username', 'balance']);
      req.body.password && (publicFields = publicFields.concat(['password']));
    }

    // check age
    if (req.body.age && req.body.age < 18) {
      return next(
        PopulateResponse.validationError({ msg: 'Das Alter muss mindestens 18 sein!' })
      );
    }

    if (req.body.balance && req.body.balance < 0) {
      return next(
        PopulateResponse.validationError({ msg: 'Das Guthaben muss größer als 0 sein' })
      );
    }

    const fields = _.pick(req.body, publicFields);
    _.merge(user, fields);
    if (user.type === 'user') {
      user.isApproved = true;
    }
    await user.save();

    res.locals.update = user;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.me = (req, res, next) => {
  res.locals.me = req.user.getPublicProfile();
  next();
};

exports.findOne = async (req, res, next) => {
  try {
    const user = await DB.User.findOne({
      _id: req.params.id
    });
    res.locals.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

/**
 * find user from Add Contact Page
 */
exports.findByUsername = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      username: Joi.string().required()
    });

    const validate = schema.validate(req.params);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const query = _.merge(validate.value, {
      // type: req.user.type === 'model' ? 'user' : 'model',
      type: 'model',
      isCompletedProfile: true,
      isApproved: true,
      isActive: true,
      isBlocked: false
    });
    const user = await DB.User.findOne(query);
    if (!user) {
      return next(PopulateResponse.notFound({ message: 'Benutzername nicht gefunden' }));
    }

    const contact = await DB.Contact.findOne({
      $or: [
        { addedBy: req.user._id, userId: user._id },
        { addedBy: user._id, userId: req.user._id }
      ]
    });
    res.locals.user = { ...user.getPublicProfile(), isFriend: !!contact, contactId: contact?._id || null };
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * update user avatar
 */
exports.updateAvatar = async (req, res, next) => {
  try {
    const user = req.params.id ? await DB.User.findOne({ _id: req.params.id }) : req.user;
    if (!user) {
      return next(PopulateResponse.notFound());
    }

    const avatarSize = await DB.Config.findOne({ key: SYSTEM_CONST.AVATAR_SIZE });
    if (!avatarSize || !avatarSize.value) {
      return next(PopulateResponse.serverError({ msg: 'Avatar fehlt!' }));
    }

    const size = avatarSize.value.split('x');
    const width = size[0] || 200;
    const height = size.length > 1 ? size[1] : 200;
    // create thumb for the avatar
    const thumbPath = await Image.resize({
      input: req.file.path,
      width,
      height,
      resizeOption: '^'
    });

    await DB.User.update({ _id: req.params.id || req.user._id }, { $set: { avatar: thumbPath } });

    // unlink old avatar
    if (user.avatar && !Helper.String.isUrl(user.avatar) && fs.existsSync(path.resolve(user.avatar))) {
      fs.unlinkSync(path.resolve(user.avatar));
    }
    // remove tmp file
    // if (fs.existsSync(path.resolve(req.file.path))) {
    //   fs.unlinkSync(path.resolve(req.file.path));
    // }

    res.locals.updateAvatar = {
      url: DB.User.getAvatarUrl(thumbPath)
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

async function checkAndConvertFriend(models, user) {
  const query = {
    $or: [
      { userId: user._id, addedBy: { $in: models } },
      { userId: { $in: models }, addedBy: user._id }
    ]
  };
  const contacts = await DB.Contact.find(query);
  const array = models.map((model) => {
    const data = new UserDto(model).toSearchResponse(user.role === 'admin');
    const isFriend = contacts.find(
      (contact) => contact.userId.toString() === model._id.toString() || contact.addedBy.toString() === model._id.toString()
    );

    data.isFriend = !!isFriend;
    return data;
  });
  return array;
}

exports.search = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;

  try {
    let query = Helper.App.populateDbQuery(req.query, {
      text: ['phoneNumber', 'email', 'username'],
      boolean: ['isOnline', 'isApproved', 'isCompletedProfile', 'isCompletedDocument', 'isActive', 'isBlocked', 'emailVerified'],
      equal: ['role', 'type', 'gender', 'city', 'state', 'country']
    });

    if (req.user.role !== 'admin') {
      query = {
        ...query,
        isApproved: true,
        isCompletedProfile: true,
        isActive: true,
        isBlocked: false
      };
    }
    const sort = Helper.App.populateDBSort(req.query);
    const count = await DB.User.count(query);
    const items = await DB.User.find(query)
      .collation({ locale: 'en' })
      .sort(sort)
      .skip(page * take)
      .limit(take)
      .exec();

    res.locals.search = {
      count,
      items: await checkAndConvertFriend(items, req.user)
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.searchFriends = async (req, res, next) => {
  const page = Math.max(0, req.query.page - 1) || 0; // using a zero-based page index for use with skip()
  const take = parseInt(req.query.take, 10) || 10;
  try {
    let query = Helper.App.populateDbQuery(req.query, {
      text: ['phoneNumber', 'email', 'username'],
      boolean: ['isOnline', 'isApproved', 'isCompletedProfile', 'isCompletedDocument', 'isActive', 'isBlocked'],
      equal: ['role', 'type', 'gender', 'city', 'state', 'country']
    });

    if (req.user.role !== 'admin') {
      query = {
        ...query,
        isApproved: true,
        isCompletedProfile: true,
        isActive: true,
        isBlocked: false
      };
    }

    const sort = Helper.App.populateDBSort(req.query);
    const items = await DB.User.find(query)
      .collation({ locale: 'en' })
      .sort(sort)
      .exec();

    // add user response and check for friend
    const newItems = await checkAndConvertFriend(items, req.user);
    const data = newItems.filter((i) => i.isFriend);
    res.locals.search = {
      count: data.length,
      items: data.slice(page * take, (page + 1) * take)
    };
    next();
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const user = DB.User.findOne({ _id: req.params.userId });
    if (!user) {
      return next(PopulateResponse.notFound());
    }

    if (user.role === 'admin') {
      return next(PopulateResponse.forbidden());
    }

    // permanently delete
    // contact
    await DB.Contact.deleteMany({
      $or: [{ addedBy: req.params.userId }, { userId: req.params.userId }]
    });
    // conversation
    await DB.Conversation.deleteMany({ memberIds: req.params.userId });
    // conversation meta
    await DB.ConversationUserMeta.deleteMany({ userId: req.params.userId });
    // message
    await DB.Message.deleteMany({
      $or: [{ senderId: req.params.userId }, { recipientId: req.params.userId }]
    });
    // device
    await DB.Device.deleteMany({ userId: req.params.userId });
    // invoice
    await DB.Invoice.deleteMany({ userId: req.params.userId });
    // transaction
    await DB.Transaction.deleteMany({ userId: req.params.userId });
    // payout
    await DB.PayoutRequest.deleteMany({ modelId: req.params.userId });
    // purchase item
    const purchaseItems = await DB.PurchaseItem.find({ userId: req.params.userId }).exec();
    if (user.type === 'model') {
      // sell item - not remove purchase item
      const sellItemIds = purchaseItems.map((i) => i.sellItemId);
      await DB.SellItem.deleteMany({
        $and: [{ userId: req.params.userId }, { _id: { $nin: sellItemIds } }]
      });

      // earning
      await DB.Earning.deleteMany({ modelId: req.params.userId });
    }
    // media - not remove purchase item
    const mediaIds = purchaseItems.map((i) => i.mediaId);
    await DB.Media.deleteMany({
      $and: [{ ownerId: req.params.userId }, { _id: { $nin: mediaIds } }]
    });
    await DB.PurchaseItem.deleteMany({ userId: req.params.userId });
    // share love
    await DB.ShareLove.deleteMany({
      $or: [{ userId: req.params.userId }, { modelId: req.params.userId }]
    });
    // phone verify
    await DB.VerifyCode.deleteMany({ userId: req.params.userId });
    // user social
    // await DB.UserSocial.deleteMany({ userId: req.params.userId });
    await user.remove();
    res.locals.remove = { success: true };
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      username: Joi.string().min(3).required(),
      gender: Joi.string().allow('male', 'female', 'transgender').required(),
      bio: Joi.string().min(6).required(),
      age: Joi.number().min(18).required(),
      address: Joi.string().allow('', null).optional(),
      city: Joi.string().allow('', null).optional(),
      state: Joi.string().allow('', null).optional(),
      country: Joi.string().allow('', null).optional(),
      phoneNumber: Joi.string().allow('', null).optional(),
      messageSound: Joi.string().allow('', null).optional(),
      email: Joi.string().email().required()
    });

    const validate = schema.validate(req.body);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    const user = await DB.User.findOne({ _id: req.user._id }); // ? User update profile

    if (!user) {
      return next(PopulateResponse.error({ msg: 'Benutzername nicht gefunden!' }));
    }

    const username = validate.value.username.toLowerCase().trim();
    const email = validate.value.email.trim();
    const count = await DB.User.count({ $or: [{ username }, { email }], _id: { $ne: user._id } });

    if (count) {
      return next(PopulateResponse.error({ msg: 'Benutzername oder Email ist vergeben!' }));
    }

    _.merge(user, validate.value);

    await user.save();
    const isCompletedProfile = await Service.User.updateCompletedProfile(user);
    user.isCompletedProfile = isCompletedProfile.success;
    res.locals.update = user.getPublicProfile();
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.updateDocument = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      birthday: Joi.string().required(),
      instagram: Joi.string().allow(null, '').optional(),
      twitter: Joi.string().allow(null, '').optional(),
      number: Joi.string().required(),
      type: Joi.string().allow('passport', 'ID', 'driverCard').required(),
      zipCode: Joi.string().required(),
      isConfirm: Joi.boolean().required(),
      isExpired: Joi.boolean().allow(null, '').default(false).optional(),
      expiredDate: Joi.string().allow(null, '').optional(),
      isApproved: Joi.boolean().optional() // ? admin approve the document
    });

    const validate = schema.validate(req.body);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }
    const query = {
      _id: req.user.role === 'admin' ? req.params.id : req.user._id
    };
    const user = await DB.User.findOne(query);
    if (!user) {
      return next(PopulateResponse.notFound());
    }

    user.verificationDocument = Object.assign(user.verificationDocument, _.omit(validate.value, ['isApproved']));
    user.isCompletedDocument = true;
    if (req.user.role === 'admin') {
      user.isApproved = validate.value.isApproved || false;
    }
    await user.save();
    res.locals.document = user.verificationDocument;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.updateTokenPerMessage = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      token: Joi.number().min(1).required()
    });

    const validate = schema.validate(req.body);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    if (req.user.type !== 'model') {
      return next(PopulateResponse.forbidden({ message: 'Only models can update!' }));
    }

    req.user.tokenPerMessage = validate.value.token;
    await req.user.save();
    res.locals.tokenPerMessage = req.user;
    return next();
  } catch (e) {
    return next(e);
  }
};

exports.getOTP = async (req, res, next) => {
  try {
    const code = process.env.PHONE_DEBUG ? '0000' : Helper.String.randomString(4, '1234567890');
    let data = await DB.VerifyCode.findOne({ email: req.user.email });
    if (!data) {
      data = new DB.VerifyCode({ userId: req.user._id, email: req.user.email });
    }
    data.code = code;
    await data.save();
    const siteName = await DB.Config.findOne({ key: SYSTEM_CONST.SITE_NAME });
    // send mail with verify code to user
    await Service.Mailer.send('code-deactive-email.html', req.user.email, {
      subject: 'Ihr Verifizierungscode zur Deaktivierung',
      verifyCode: code.toString(),
      siteName: siteName?.value || 'Date2.net'
    });

    res.locals.getOTP = PopulateResponse.success({ message: 'OTP Verifizierungscode wurde versendet!' }, 'OTP_SENT');
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * update model certification photo
 */
exports.updateCertificationPhoto = async (req, res, next) => {
  try {
    const user = req.params.id
      ? await DB.User.findOne({
        _id: req.params.id,
        type: 'model' // only model to update certification
      })
      : req.user;
    if (!user) {
      return next(PopulateResponse.notFound());
    }

    const thumbnailSize = await DB.Config.findOne({ key: SYSTEM_CONST.PHOTO_THUMB_SIZE });
    let width = 200;
    let height = 200;
    if (thumbnailSize) {
      const spl = thumbnailSize.value.split('x');
      if (spl.length === 2) {
        width = spl[0];
        height = spl[1];
      }
    }

    // create thumb for the certification
    const thumbPath = await Image.resize({
      input: req.file.path,
      width,
      height,
      resizeOption: '^'
    });
    const updateString = `verificationDocument.${req.query.position}`;
    const update = {
      [updateString]: thumbPath
    };

    await DB.User.update(
      {
        _id: req.params.id || req.user._id
      },
      {
        $set: update
      }
    );
    // unlink old certification
    if (
      user.verificationDocument
      && user.verificationDocument[req.query.position]
      && !Helper.String.isUrl(user.verificationDocument[req.query.position])
      && fs.existsSync(path.resolve(user.verificationDocument[req.query.position]))
    ) {
      fs.unlinkSync(path.resolve(user.verificationDocument[req.query.position]));
    }

    // remove tmp file
    // if (fs.existsSync(path.resolve(req.file.path))) {
    //   fs.unlinkSync(path.resolve(req.file.path));
    // }

    res.locals.updateCertificationPhoto = {
      url: DB.User.getAvatarUrl(update[updateString]) // convert to string
    };
    return next();
  } catch (e) {
    return next(e);
  }
};

/**
 * User update password
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      newPassword: Joi.string().min(6).required()
    });

    const validate = schema.validate(req.body);
    if (validate.error) {
      return next(PopulateResponse.validationError(validate.error));
    }

    return passport.authenticate('local', async (err, user, info) => {
      const error = err || info;
      if (error) {
        return next(error);
      }
      if (!user) {
        return next(PopulateResponse.notFound());
      }

      // eslint-disable-next-line no-param-reassign
      user.password = validate.value.newPassword;
      await user.save();

      res.locals.updatePassword = {
        success: true
      };
      return next();
    })(req, res, next);
  } catch (e) {
    return next(e);
  }
};

/**
 * User deactive account yourself
 */
exports.deactiveAccount = async (req, res, next) => {
  try {
    const user = req.user;
    user.isBlocked = true;
    await user.save();

    res.locals.deactive = PopulateResponse.success(
      { message: 'Ihr Konto wurde deaktiviert. Sie werden abgemeldet.' },
      'USER_DEACTIVED'
    );
    next();
  } catch (e) {
    next(e);
  }
};
