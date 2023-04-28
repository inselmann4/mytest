import { conversationService } from '@services/conversation.service';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { connect, ConnectedProps } from 'react-redux';
import { toast } from 'react-toastify';

const mapStates = (state: any) => ({
  isLoggedIn: state.auth.isLoggedIn,
  authUser: state.auth.authUser
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

type IProps = {
  user: any;
  chidren?: ReactNode;
  isFriend: boolean;
};

function ChatButton({
  authUser,
  user,
  isLoggedIn,
  isFriend,
  chidren = null
}: IProps & PropsFromRedux) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * redirect to chat page
   */
  const handleChat = async () => {
    try {
      if (authUser.type === 'model') {
        toast.error('Sorry! Nur Kunden können an Amateure schreiben.');
        return;
      }
      if (!isLoggedIn) {
        toast.error('Bitte melden Sie sich an, um diese Aktion durchzuführen!');
        return;
      }
      if (!isFriend) {
        toast.error(`Bitte als Favorit hinzufügen, um den Chat zu starten.`);
        return;
      }
      setLoading(true);
      const conversation = await conversationService.create({ userId: user._id });
      router.push({
        pathname: '/conversation/[id]',
        query: {
          id: conversation.data._id
        }
      });
    } catch (e) {
      const err = await e;
      toast.error(err?.data?.message || 'Ein Fehler ist aufgetreten, bitte später nochmal versuchen!');
    }
  };

  return (
    <OverlayTrigger
      placement="top"
      overlay={(
        <Tooltip id="tooltip">
          <span className="text-tooltip">Chat</span>
        </Tooltip>
    )}
    >
      <button
        className="mx-1 btn btn-primary"
        type="button"
        onClick={handleChat}
        disabled={loading}
      >
        {!!chidren || (
        <>
          <i className="far fa-comments" />
          <span className="ml-1 text-chat">Chat</span>
        </>
        )}

      </button>
    </OverlayTrigger>
  );
}

export default connector(ChatButton);
