import { Formik, FormikHelpers, FormikProps } from 'formik';
import { useEffect, useState } from 'react';
import { Button, FormControl } from 'react-bootstrap';
import { connect } from 'react-redux';
import { toast } from 'react-toastify';
// Actions
import { sendMessage } from 'src/redux/message/actions';
// Services
import { mediaService } from 'src/services';
import * as Yup from 'yup';

// Child component
import SendFile from './send-file';

interface IProps {
  selectedConversation: any;
  sendMessage: Function;
  authUser: any;
  blockConvStore: any;
  unBlockConvStore: any;
  haveBeenBlockStatus: boolean;
}

interface FormValues {
  message: string;
}
const schema = Yup.object().shape({
  message: Yup.string().required('Nachricht erforderlich')
});

function ChatFooter({
  selectedConversation,
  sendMessage: sendMess,
  authUser,
  blockConvStore,
  unBlockConvStore,
  haveBeenBlockStatus
}: IProps) {
  const [sendFileBox, openSendFileBox] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [placeHolder, setPlaceHolder] = useState('Bitte Nachricht hier eingeben...');

  useEffect(() => {
    // Anything in here is fired on component mount.
    document.addEventListener('mousedown', (e: any) => {
      if (document.getElementById('file-selector')?.contains(e.target)) {
        // Clicked in box
      } else {
        // Clicked outside the box
        openSendFileBox(false);
      }
      // });
    });

    return () => {
      // Anything in here is fired on component unmount.
      document.removeEventListener('mousedown', (e: any) => {
        if (document.getElementById('file-selector')?.contains(e.target)) {
          // Clicked in box
        } else {
          // Clicked outside the box
          openSendFileBox(false);
        }
      });
    };
  }, []);

  useEffect(() => {
    const receiver = selectedConversation.members.find((i) => i._id !== authUser._id);
    if (receiver.isBlocked || !receiver.isActive) {
      // user is deactivate
      setIsBlocked(true);
      setPlaceHolder('Dieser Benutzer ist nicht verfügbar');
    } else if (selectedConversation.blockedIds && selectedConversation.blockedIds.length > 0) {
      setIsBlocked(true);
      if (selectedConversation.blockedIds.findIndex((blockedId) => blockedId === authUser._id) > -1) {
        // auth user have been blocked
        setPlaceHolder('Der Benutzer ignoriert Sie');
      } else {
        // auth user is blocking receiver user
        setPlaceHolder('Sie haben diesen Benutzer ignoriert');
      }
    } else {
      setIsBlocked(false);
      setPlaceHolder('Bitte Nachricht hier eingeben...');
    }
  }, [selectedConversation, haveBeenBlockStatus, blockConvStore, unBlockConvStore]);

  const handleSendMedia = async (dataFiles: any) => {
    if (dataFiles && dataFiles.length > 3) {
      return toast.error('Es können nicht mehr als 3 Medien gleichzeitig gesendet werden');
    }
    return Promise.all(
      dataFiles.map((file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('systemType', 'message');
        if (file.type.indexOf('video') > -1) {
          return mediaService.uploadVideo(formData);
        } if (file.type.indexOf('image') > -1) {
          return mediaService.uploadPhoto(formData);
        }
        return null;
      })
    ).then((updatedFiles: any) => {
      const files = updatedFiles.map((item) => item?.data);
      const fileIds = files.map((file) => file._id);
      const data = {
        type: files[0]?.type,
        fileIds,
        conversationId: selectedConversation._id
        // socketId: socket.status === 'connected' ? socket.id : null
      };
      sendMess(data);
      openSendFileBox(false);
    });
  };
  const handleSendFile = async (files: any) => {
    if (files && files.length > 1) {
      return toast.error('Can\'t send more than a file at once');
    }
    return Promise.all(
      files.map((file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('systemType', 'message');
        return mediaService.uploadFile(formData);
      })
    ).then((updatedFiles: any) => {
      const data = {
        type: updatedFiles[0]?.data?.type,
        fileIds: [updatedFiles[0]?.data?.id],
        conversationId: selectedConversation._id
        // socketId: socket.status === 'connected' ? socket.id : null
      };
      sendMess(data);
      openSendFileBox(false);
    });
  };

  const handleSendMessage = (message: any) => {
    if (/\S/.test(message)) {
      const data = {
        text: message,
        conversationId: selectedConversation._id,
        type: 'text'
        // socketId: socket.status === 'connected' ? socket.id : null
      };
      sendMess(data);
    }
  };


const handleKeyDown = (event:any, cb: Function)=> {
    if (event.keyCode === 13 || event.key === 'Enter') {
event.preventDefault()
      cb()
    }
  }

  return (
    <>
      {/* <!-- Chat Footer Start--> */}
      <div className="chat-footer">
        <div className="attachment">
          <div className={sendFileBox ? 'dropdown show' : 'dropdown'}>
            <button
              className="btn btn-add-content"
              type="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              onClick={() => !isBlocked && openSendFileBox(!sendFileBox)}
            >
              <svg className="hw-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <div
              id="file-selector"
              className={sendFileBox ? 'dropdown-menu show' : 'dropdown-menu'}
              style={
                sendFileBox
                  ? {
                    position: 'absolute',
                    transform: 'translate3d(0px, -92px, 0px)',
                    top: 0,
                    left: 0,
                    willChange: 'transform'
                  }
                  : {}
              }
            >
              <SendFile onDrop={handleSendMedia} type="media" />
              <SendFile onDrop={handleSendFile} type="file" />
            </div>
          </div>
        </div>
        <Formik
          validationSchema={schema}
          initialValues={{ message: '' }}
          onSubmit={async (values: FormValues, formikHelpers: FormikHelpers<FormValues>) => {
            handleSendMessage(values.message);
            formikHelpers.setSubmitting(false);
            formikHelpers.resetForm();
          }}
          render={(props: FormikProps<FormValues>) => (
            <form onSubmit={props.handleSubmit}>
              <FormControl
                as="textarea"
                key="typeInput"
                value={props.values.message}
                type="text"
                name="message"
                id="message"
                placeholder={placeHolder}
                disabled={isBlocked}
                onChange={props.handleChange.bind(this)}
onKeyDown={(e:any) => handleKeyDown(e, props.handleSubmit)}
                onKeyPress={() => props.handleSubmit}
              />
              <Button className="btn btn-primary btn-icon send-icon rounded-circle text-light mb-1" type="submit">
                <svg className="hw-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </form>
          )}
        />
      </div>
      {/* <!-- Chat Footer End--> */}
    </>
  );
}

const mapStateToProps = (state: any) => ({
  authUser: state.auth.authUser,
  selectedConversation: state.conversation.selectedConversation,
  blockConvStore: state.conversation.blockConvStore,
  unBlockConvStore: state.conversation.unBlockConvStore,
  haveBeenBlockStatus: state.conversation.haveBeenBlockStatus,
  socket: state.socket
});
const mapDispatch = { sendMessage };
export default connect(mapStateToProps, mapDispatch)(ChatFooter) as any;
