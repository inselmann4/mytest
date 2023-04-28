import moment from 'moment';
import 'moment/locale/de';
import Link from 'next/link';
import Router from 'next/router';
import { useEffect, useState } from 'react';

interface IProps {
  conversations: any;
  authUser: any;
}
const now = moment(new Date(), 'DD/MM/YYYY HH:mm:ss');

function ConversationList({ conversations, authUser }: IProps) {
  const [selectedConversationId, setSelectedConversationId] = useState(Router.query.id || '');
  const renderDate = (date: any) => {
    const diff = now.diff(date);
    const duration = moment.duration(diff);
    const hour = duration.asHours();
    const year = duration.asYears();
    if (hour < 24) {
      return moment(date).format('HH:mm');
    }
    if (year < 1) {
      return moment(date).format('HH:mm DD/MM');
    }
    return moment(date).format('HH:mm DD/MM/YY');
  };

  useEffect(() => {
    if (conversations.findIndex((conv) => !conv.members || conv?.members?.length === 0) > -1) {
      Router.reload();
    }
  }, [conversations.length]);

  return (
    <div className="contacts-list">
      {conversations.map((conv: any) => {
        const user = conv.members.find((m) => m._id !== authUser._id);
        return (
          <div
            className={`contacts-item ${conv.unreadMessageCount > 0 ? 'unread' : 'friends'}${selectedConversationId === conv._id ? ' active' : ''}`}
            key={conv._id}
            onClick={() => setSelectedConversationId(conv._id)}
          >
            <Link
              legacyBehavior
              href={{
                pathname: '/conversation/[id]',
                query: { id: conv._id }
              }}
            >
              <a href="#" className="contacts-link">
                <div className={`avatar ${user.isOnline ? 'avatar-online' : 'avatar-offline'}`}>
                  <img key={`${user._id}1`} src={user.avatarUrl} alt="avatar" />
                </div>
                <div className="contacts-content">
                  <div className="contacts-info">
                    <h6 className="chat-name text-truncate" key={user._id}>
                      {user.username}
                    </h6>
                    <div className="chat-time">{renderDate(conv.updatedAt)}</div>
                  </div>
                  <div className="contacts-texts">
                    {conv?.lastMessage?.type === 'photo' && [
                      <svg key="svg-photo" className="hw-20 text-muted" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>,
                      <p key="svg-text" className="text-truncate">
                        Photo
                      </p>
                    ]}
                    {conv?.lastMessage?.type === 'video' && [
                      <svg key="svg-video" className="hw-20 text-muted" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>,
                      <p key="svg-text" className="text-truncate">
                        Video
                      </p>
                    ]}
                    {conv?.lastMessage?.type === 'file' && [
                      <svg
                        key="svg-file"
                        className="hw-20 text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>,
                      <p key="svg-text" className="text-truncate">
                        File
                      </p>
                    ]}
                    {conv?.lastMessage?.type === 'text' && <p className="text-truncate">{conv?.lastMessage?.text}</p>}
                    {conv.unreadMessageCount > 0 && (
                      <div className="badge badge-rounded badge-primary ml-1">{conv.unreadMessageCount}</div>
                    )}
                  </div>
                </div>
              </a>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export default ConversationList;
