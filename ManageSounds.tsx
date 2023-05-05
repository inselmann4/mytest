import { authService } from '@services/auth.service';
import { Formik, FormikProps } from 'formik';
import { Button, Form, FormControl } from 'react-bootstrap';
import { connect, ConnectedProps } from 'react-redux';
import { updateProfile } from 'src/redux/auth/actions';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

interface FormValues {
  messageSound: any;
}

const schema = Yup.object().shape({
  messageSound: Yup.string()
});

const mapStates = (state: any) => ({
  authUser: state.auth.authUser
});


const mapDispatch = { updateProfile };
const connector = connect(mapStates, mapDispatch);


type PropsFromRedux = ConnectedProps<typeof connector>;


function ManageSounds({ authUser, updateProfile: dpUpdateProfile }: PropsFromRedux) {

let { username, gender, bio, age, email } = authUser


const playSound = (url: string) => {
    const audio = new Audio(url);
    audio.addEventListener('canplaythrough', (event) => {
      audio.play();
    });
  };



  return (
    <div className="card mb-3">
      <div className="card-header">Nachrichtentöne - Einstellungen</div>
      <Formik
        validationSchema={schema}
        initialValues={{ messageSound: authUser?.messageSound }}

onSubmit={(values: FormValues) => dpUpdateProfile({ username, gender, bio, age, email, ...values })}


      >
        {(props: FormikProps<FormValues>) => (
          <form onSubmit={props.handleSubmit}>
            <div className="card-body card-bg-1">
              <Form.Group>
                <Form.Control
                  isInvalid={props.touched.messageSound && !!props.errors.messageSound}
                  as="select"
                  name="messageSound"
                  id="messageSound"
                  className="form-control form-control-md"
                  type="text"

                  onChange={(e:any) => {
                    props.handleChange(e);
                    playSound(e.nativeEvent.target.value)
                  }}

                  onBlur={props.handleBlur}
                  value={props.values.messageSound}
                >
                  <option value="">Aus</option>
                  <option value="https://date2.net/sounds/beep.mp3">Beep</option>
                  <option value="https://date2.net/sounds/blech.mp3">Blech</option>
                  <option value="https://date2.net/sounds/blubb.mp3">Blubb</option>
                  <option value="https://date2.net/sounds/clap.mp3">Clap</option>
                  <option value="https://date2.net/sounds/click.mp3">Click</option>
                  <option value="https://date2.net/sounds/dingdong.mp3">Dingdong</option>
                  <option value="https://date2.net/sounds/salute.mp3">Salute</option>
                </Form.Control>
                <div className="invalid-feedback">{props.errors.messageSound as any}</div>
              </Form.Group>
            </div>
            <div className="card-footer d-flex justify-content-end">
              <Button variant="primary" type="submit">
                Änderungen speichern
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
}

export default connector(ManageSounds);



