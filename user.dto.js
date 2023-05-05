const { pick } = require('lodash');

class UserDto {
  constructor(data = {}) {
    if (!data) return;

    Object.assign(this, pick(data, [
      '_id',
      'name',
      'username',
      'email',
      'role',
      'provider',
      'avatar',
      'phoneNumber',
      'gender',
      'age',
      'bio',
      'address',
      'city',
      'state',
      'country',
      'balance',
      'isOnline',
      'lastOnline',
      'lastOffline',
      'shareLove',
      'tokenPerMessage',
      'type',
      'isCompletedProfile',
      'isCompletedDocument',
      'isApproved',
      'verificationDocument',
      'emailVerifiedToken',
      'passwordResetToken',
      'isBlocked',
      'isActive',
      'emailVerified',
      'messageSound',
      'createdAt',
      'updatedAt'
    ]));

    this.lastActivity = this.lastOnline || this.lastOffline;
    this.avatarUrl = this.getAvatarUrl();

    // other fields for search or populate from others
    this.isFriend = false;
  }

  getAvatarUrl() {
    if (Helper.String.isUrl(this.avatar)) {
      return this.avatar;
    }

    const newFilePath = this.avatar || 'public/assets/default-avatar.png';
    return Helper.App.getPublicFileUrl(newFilePath);
  }

  static fromModel(data) {
    return new UserDto(data);
  }

  static fromModels(items) {
    return items.map((item) => new UserDto(item));
  }

  toSearchResponse(includePrivateData = false) {
    const privateData = [
      'email',
      'name',
      'isActive',
      'isApproved',
      'isBlocked',
      'isCompletedProfile',
      'isCompletedDocument',
      'emailVerified'
    ];
    const publicData = [
      '_id',
      'username',
      'role',
      'avatarUrl',
      'gender',
      'age',
      'bio',
      'isOnline',
      'shareLove',
      'tokenPerMessage',
      'type',
      'lastActivity',
      'messageSound',
      'createdAt',
      'updatedAt'
    ];

    if (!includePrivateData) return pick(this, publicData);
    return pick(this, [
      ...publicData,
      ...privateData
    ]);
  }

  toShortInfo() {
    return pick(this, [
      '_id',
      'name',
      'username',
      'role',
      'avatarUrl',
      'gender',
      'age',
      'isOnline',
      'shareLove',
      'tokenPerMessage',
      'type',
      'lastActivity',
      'isActive',
      'messageSound',
      'createdAt',
      'updatedAt'
    ]);
  }
}

exports.UserDto = UserDto;
module.exports = UserDto;
