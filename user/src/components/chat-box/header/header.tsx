import SendTipButton from '@components/contact/send-tip-button';
import PageTitle from '@components/page-title';
import { conversationService } from '@services/conversation.service';
import Router from 'next/router';
import { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { toast } from 'react-toastify';
// Child component
import SearchBar from 'src/components/chat-box/header/search-bar';
// Actions
import { blockConversation, deleteConversation, unBlockConversation } from 'src/redux/conversation/actions';
import { loadMessage, setUsingSearchBar } from 'src/redux/message/actions';

import NotesModal from '../../NotesModal/NotesModal';


interface IProps {
  usingSearchBar?: boolean;
}


const mapStateToProps = (state: any) =>{
    console.log(state)
    return ({
      recipient: state.message.recipient,
      usingSearchBar: state.message.usingSearchBar,
      selectedConversation: state.conversation.selectedConversation,
      authUser: state.auth.authUser
    });
}

const mapDispatch = {
  dpLoadMessage: loadMessage,
  dpBlockConversation: blockConversation,
  dpUnBlockConversation: unBlockConversation,
  dpDeleteConversation: deleteConversation,
  dpSetUsingSearchBar: setUsingSearchBar
};

const connector = connect(mapStateToProps, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

function ChatHeader({
  authUser,
  recipient,
  selectedConversation,
  usingSearchBar = false,
  dpBlockConversation,
  dpUnBlockConversation,
  dpDeleteConversation,
  dpLoadMessage,
  dpSetUsingSearchBar
}: IProps & PropsFromRedux) {
  const [isSearch, setIsSearch] = useState(usingSearchBar || false);
  const [dropdown, openDropdown] = useState(false);
  const [miniDropdown, openMiniDropdown] = useState(false);
  const [isBlocked, setIsBlocked] = useState(
    selectedConversation.blockedIds.findIndex((blockedId) => blockedId === recipient._id) > -1
  );



  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true)
  const closeModal = () => setShowModal(false)



  useEffect(() => {
    // Anything in here is fired on component mount.
    document.addEventListener('mousedown', (e: any) => {
      if (document.getElementById('action-selector')?.contains(e.target)) {
        // Clicked in box
      } else {
        // Clicked outside the box
        openDropdown(false);
      }
      // });
    });

    return () => {
      // Anything in here is fired on component unmount.
      document.removeEventListener('mousedown', (e: any) => {
        if (document.getElementById('action-selector')?.contains(e.target)) {
          // Clicked in box
        } else {
          // Clicked outside the box
          openDropdown(false);
        }
      });
    };
  }, []);

  const handleBlockConversation = async () => {
    const conversationId = selectedConversation._id;
    const blockedId = recipient._id;
    try {
      await conversationService.block(conversationId, { blockedId });
      if (authUser?.type === 'model') {
        toast.success('Sie haben diesen Benutzer ignoriert. Sie können keine Nachrichten senden oder empfangen.');
      } else if (authUser?.type === 'user') {
        toast.success('Sie haben diesen Amateur ignoriert. Sie können keine Nachrichten senden oder empfangen.');
      }
      dpBlockConversation({ conversationId, blockedId });
    } catch (e) {
      const error = await e;
      if (authUser?.type === 'model') {
        toast.error(error?.message || 'Benutzer ignorieren ist fehlgeschlagen!');
      } else if (authUser?.type === 'user') {
        toast.error(error?.message || 'Amateur ignorieren ist fehlgeschlagen!');
      }
    }
  };

  const handleUnBlockConversation = async () => {
    const conversationId = selectedConversation._id;
    const blockedId = recipient._id;
    try {
      await conversationService.unBlock(conversationId, { blockedId });
      if (authUser?.type === 'model') {
        toast.success('Sie haben den Benutzer freigegeben.');
      } else if (authUser?.type === 'user') {
        toast.success('Sie haben den Amateur freigegeben.');
      }
      dpUnBlockConversation({ conversationId, blockedId });
    } catch (e) {
      const error = await e;
      if (authUser?.type === 'model') {
        toast.error(error?.message || 'Benutzer freigeben ist fehlgeschlagen!');
      } else if (authUser?.type === 'user') {
        toast.error(error?.message || 'Amateur freigeben ist fehlgeschlagen!');
      }
    }
  };

  const handleBlockBtn = () => {
    if (isBlocked) {
      handleUnBlockConversation();
      setIsBlocked(false);
    } else {
      handleBlockConversation();
      setIsBlocked(true);
    }
  };

  const handleSearch = (query: any) => {
    dpLoadMessage({ conversationId: selectedConversation._id, query: { ...query, page: 1, take: 100 } });
    setTimeout(() => dpSetUsingSearchBar(true), 700);
  };

  const handleLoadAllMessage = () => {
    dpLoadMessage({ conversationId: selectedConversation._id, query: { page: 1, take: 20 } });
  };

  const onClickAvatarChatroom = () => {
    if (recipient?.type === 'model') {
      Router.push(`/models/${recipient?.username}`);
    }
  };

  const deletedConversation = async (conversationId: string) => {
    try {
      const resp = await conversationService.delete(conversationId);
      toast.success(resp.data.data.message || 'Unterhaltung wurde gelöscht!');
      dpDeleteConversation(conversationId);
      Router.push('/conversation');
    } catch (e) {
      const error = await e;
      toast.error(error?.message || 'Unterhaltung löschen ist fehlgeschlagen!');
    }
  };

  return (
    <>
      <PageTitle title={!recipient ? '...' : `Chat mit ${recipient.username}`} />
      {/* <!-- Chat Header Start--> */}
      <div className="chat-header">
        {/* <!-- Chat Back Button (Visible only in Small Devices) --> */}
        <button
          className="btn btn-secondary btn-icon btn-minimal btn-sm text-muted d-xl-none"
          type="button"
          data-close=""
          onClick={() => Router.push('/conversation')}
        >
          <svg className="hw-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="media chat-name align-items-center text-truncate pointer" style={{flex: "none"}} onClick={() => onClickAvatarChatroom()}>
          <div
            className={`avatar d-none d-sm-inline-block mr-3 ${recipient?.isOnline ? ' avatar-online' : 'avatar-offline'
            }`}
          >
            <img src={recipient?.avatarUrl || '/images/user1.jpg'} alt="" />
          </div>





          <div className="media-body align-self-center mr-4">
            <h6 className="text-truncate mb-0">{recipient?.username}</h6>
            <small className="text-muted">{recipient?.isOnline ? 'Online' : 'Offline'}</small>
          </div>
         {authUser?.type === 'model' && <> 
          <div className="align-self-center mr-3">
            <h6 className="mb-1">Land: <span className="text-muted">{recipient?.country}</span></h6>
            <h6 className="mb-0">Bundesland: <span className="text-muted">{recipient?.state}</span></h6>
          </div>
          <div className="align-self-center mr-3">
            <h6 className="mb-1">Stadt: <span className="text-muted">{recipient?.city}</span></h6>
            <h6 className="mb-0">Coin Guthaben: <span className="text-muted">{recipient?.balance.toFixed(2)}</span></h6>
          </div>
          <div className="align-self-center">
              <button onClick={openModal} type="button" className="flex btn btn-primary"><span className="hide-mobile">Notizen</span></button>
          </div>
          </>}
        </div>


        <NotesModal 
          initialNotes={selectedConversation.notes}
          conversationId={selectedConversation._id}
          show={showModal}
          onCancel={closeModal}
        />


        {/* <!-- Chat Options --> */}
        <ul className="nav flex-nowrap">
          {authUser.type === 'user' && recipient?.type === 'model' && (
            <li>
              <SendTipButton model={recipient} />
            </li>
          )}
          <li className="nav-item list-inline-item d-none d-sm-block mr-1">
            <a
              aria-hidden
              className="nav-link text-muted px-1"
              data-toggle="collapse"
              data-target="#searchCollapse"
              aria-expanded="false"
              onClick={() => setIsSearch(!isSearch)}
            >
              <svg className="hw-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </a>
          </li>
          <li className="nav-item list-inline-item d-none d-sm-block mr-0">
            <div className="dropdown">
              <a
                aria-hidden
                className="nav-link text-muted px-1"
                role="button"
                title="Details"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
                onClick={() => openDropdown(!dropdown)}
              >
                <svg className="hw-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </a>
              <div
                id="action-selector"
                className={dropdown ? 'dropdown-menu dropdown-menu-right show' : 'dropdown-menu dropdown-menu-right'}
              >
                <a
                  aria-hidden
                  className="dropdown-item align-items-center d-flex"
                  onClick={() => deletedConversation(selectedConversation._id)}
                >
                  <svg className="hw-20 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Löschen</span>
                </a>
                <a
                  aria-hidden
                  className="dropdown-item align-items-center d-flex text-danger text-white"
                  onClick={handleBlockBtn}
                >
                  <svg className="hw-20 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <span>{isBlocked ? 'Freigeben' : 'Ignorieren'}</span>
                </a>
              </div>
            </div>
          </li>
          <li className="nav-item list-inline-item d-sm-none mr-0">
            <div className="dropdown">
              <a
                aria-hidden
                className="nav-link text-muted px-1"
                role="button"
                title="Details"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
                onClick={() => openMiniDropdown(!miniDropdown)}
              >
                <svg className="hw-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </a>

              <div
                className={
                  miniDropdown ? 'dropdown-menu dropdown-menu-right show' : 'dropdown-menu dropdown-menu-right'
                }
              >
                <a
                  aria-hidden
                  className="dropdown-item align-items-center d-flex"
                  data-toggle="collapse"
                  data-target="#searchCollapse"
                  aria-expanded="false"
                  onClick={() => setIsSearch(!isSearch)}
                >
                  <svg className="hw-20 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Suche</span>
                </a>
                <a
                  aria-hidden
                  className="dropdown-item align-items-center d-flex"
                  onClick={() => deletedConversation(selectedConversation._id)}
                >
                  <svg className="hw-20 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>Löschen</span>
                </a>
                <a aria-hidden className="dropdown-item align-items-center d-flex text-danger text-white" onClick={handleBlockBtn}>
                  <svg className="hw-20 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <span>{isBlocked ? 'Freigeben' : 'Ignorieren'}</span>
                </a>
              </div>
            </div>
          </li>
        </ul>
      </div>
      {/* <!-- Chat Header End--> */}

      {/* <!-- Search Start --> */}
      <div
        className={isSearch ? 'collapse border-bottom px-3 show' : 'collapse border-bottom px-3'}
        id="searchCollapse"
      >
        <SearchBar handleSearch={handleSearch} />
      </div>

      {usingSearchBar && (
        <div className="text-center">
          <span aria-hidden className="badge badge-secondary" onClick={handleLoadAllMessage}>
            <small>Alle Nachrichten einblenden</small>
          </span>
        </div>
      )}
    </>
  );
}

export default connector(ChatHeader);
