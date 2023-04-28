/* eslint-disable no-unsafe-optional-chaining */
import dynamic from 'next/dynamic';
import Router from 'next/router';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
// Actions
import { setSelectedConversation } from 'src/redux/conversation/actions';
import { loadMessage, loadOldMessage } from 'src/redux/message/actions';

const ConversationSideBar = dynamic(() => import('src/components/common-layout/sidebar/conversation-sidebar'));
const ChatContent = dynamic(() => import('src/components/chat-box/content/content'));
const ChatHeader = dynamic(() => import('src/components/chat-box/header/header'));
const ChatFooter = dynamic(() => import('src/components/chat-box/footer/footer'));

interface IProps {
  selectedConversation: any;
  conversationId: string;
  // todo - refactor above
  total: number;
  loadMessageStore: {
    requesting: boolean;
    success: boolean;
    error: any;
  };
  sendMessageStore: {
    requesting: boolean;
    success: boolean;
    error: any;
    data: any;
  };
  loadOldMessageStore: {
    requesting: boolean;
    success: boolean;
    error: any;
  };
}


const mapStateToProps = (state: any) =>{
  console.log(state)
  return ({
    ...state.message,
    selectedConversation: state.conversation.selectedConversation
  });
}



const connetor = connect(mapStateToProps);
function MessagePage({
  conversationId,
  total,
  selectedConversation,
  loadMessageStore,
  sendMessageStore,
  loadOldMessageStore
}: IProps) {
  const ditspatch = useDispatch();
  const [page, setPage] = useState(1);
  const take = 20;
  const chatRef = useRef<any>();

  const checkConversationId = () => {
    if (conversationId) {
      ditspatch(loadMessage({ conversationId, query: { page, take } }));
      ditspatch(setSelectedConversation(conversationId));
      if (total > 0 && chatRef?.current) {
        chatRef.current.scrollTop = chatRef.current?.scrollHeight;
      }
    } else {
      Router.push('/conversation');
    }
  };

  useEffect(() => {
    checkConversationId();
  }, []);

  useEffect(() => {
    if (conversationId) {
      ditspatch(loadMessage({ conversationId, query: { take, page: 1 } }));
      ditspatch(setSelectedConversation(conversationId));
    }
  }, [conversationId]);

  useEffect(() => {
    if (
      !sendMessageStore.requesting
      && sendMessageStore.success
      && !sendMessageStore.error
      && chatRef.current
    ) {
      setTimeout(() => {
        chatRef.current?.scrollBy({
          top: chatRef.current?.scrollHeight + 300,
          behavior: 'smooth'
        });
      }, 500);
    }
    if (
      !sendMessageStore.requesting
      && !sendMessageStore.success
      && sendMessageStore.error
    ) {
      toast.error(sendMessageStore.error?.data?.message || 'Nachricht senden fehlgeschlagen!');
    }
  }, [sendMessageStore]);

  useEffect(() => {
    if (
      !sendMessageStore.requesting
      && chatRef.current
    ) {
      setTimeout(() => {
        chatRef.current?.scrollBy({
          top: chatRef.current?.scrollHeight + 300,
          behavior: 'smooth'
        });
      }, 500);
    }
  }, [total]);




useEffect(() => {
    console.log("here")
    if(!selectedConversation)
      ditspatch(setSelectedConversation(conversationId))
  }, [loadMessageStore])


  useEffect(() => {
    if (
      loadOldMessageStore.requesting
      && loadOldMessageStore.success
      && !loadOldMessageStore.error
    ) {
      // this.chatRef.current?.scrollTop = 300;
      setTimeout(() => {
        chatRef.current?.scrollBy({
          top: chatRef.current?.scrollTop + 300,
          behavior: 'smooth'
        });
      }, 1000);
    }
  }, [loadOldMessageStore]);

  useEffect(() => {
    ditspatch(loadOldMessage({ conversationId, query: { take, page } }));
  }, [page]);

  const onChatScroll = (e: any) => {
    if (take * page - total > take) {
      // Cannot load more message
      return;
    }
    if (
      conversationId
      && e.currentTarget.scrollTop === 0
      && !loadOldMessageStore.error
      && !loadOldMessageStore.requesting
    ) {
      setPage(page + 1);
    }
  };
  return (
    <>
      <ConversationSideBar conversationId={conversationId} />
      <main className="main main-visible">
        <div className="chats mobile">
          <div className="chat-body">
            {!loadMessageStore.requesting && selectedConversation && <ChatHeader />}
            <div
              className="chat-content p-2"
              id="messageBody"
              ref={chatRef}
              onScroll={onChatScroll.bind(this)}
            >
              {!loadMessageStore.requesting && <ChatContent />}
            </div>

            {!loadMessageStore.requesting && selectedConversation && <ChatFooter />}
          </div>
        </div>
      </main>
    </>
  );
}

MessagePage.getInitialProps = (ctx) => {
  const conversationId = ctx.query.id;
  return { conversationId };
};

export default connetor(MessagePage);
