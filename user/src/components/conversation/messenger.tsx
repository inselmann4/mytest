import ConversationSidebar from '@components/common-layout/sidebar/conversation-sidebar';
import { useEffect, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import ChatContent from 'src/components/chat-box/content/content';
import ChatFooter from 'src/components/chat-box/footer/footer';
import ChatHeader from 'src/components/chat-box/header/header';
import { setSelectedConversation } from 'src/redux/conversation/actions';
import { loadMessage, loadOldMessage, removeMessage } from 'src/redux/message/actions';

type IMessenger = {
  conversationId: string;
};

const mapStateToProps = (state: any) => {
  const {
    selectedConversation, blockConvStore, unBlockConvStore, deleteConvStore
  } = state.conversation;

  return {
    // ...state.message,
    messageTotal: state.message.total,
    selectedConversation,
    blockConvStore,
    unBlockConvStore,
    deleteConvStore
  };
};
const mapDispatch = {
  dpSetConversation: setSelectedConversation,
  dpLoadMessage: loadMessage,
  dpRemoveMessage: removeMessage,
  dpLoadOldMessage: loadOldMessage
};
const connector = connect(mapStateToProps, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

function Messenger({
  conversationId = null,
  messageTotal,
  selectedConversation,
  dpLoadMessage,
  dpSetConversation
}: IMessenger & PropsFromRedux) {
  const chatRef = useRef(null);

  const page = 1;
  const take = 20;

  const onChatScroll = () => {};

  useEffect(() => {
    dpLoadMessage({ conversationId, query: { page, take } });
    dpSetConversation(conversationId);
  }, [conversationId]);

  useEffect(() => {
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messageTotal]);

  return (
    <>
      <ConversationSidebar conversationId={conversationId} />
      <main className="main main-visible">
        <div className="chats">
          <div className="chat-body">
            {selectedConversation && <ChatHeader />}
            <div
              className="chat-content p-2"
              id="messageBody"
              ref={chatRef}
              onScroll={onChatScroll}
            >
              {selectedConversation && <ChatContent />}
            </div>

            {selectedConversation && <ChatFooter />}
          </div>
        </div>
      </main>
    </>
  );
}

export default connector(Messenger);
