import { Formik, FormikHelpers, FormikProps } from 'formik';
import { Button, FormControl } from 'react-bootstrap';
import * as Yup from 'yup';

interface IProps {
  handleSearchConversation;
}
interface FormValues {
  username: string;
}

const schema = Yup.object().shape({
  username: Yup.string().optional()
});

function SearchBar({ handleSearchConversation }: IProps) {
  return (
    <div className="sidebar-sub-header">
      <Formik
        validationSchema={schema}
        initialValues={{ username: '' }}
        onSubmit={async (values: FormValues, formikHelpers: FormikHelpers<FormValues>) => {
          handleSearchConversation(values);
          formikHelpers.setSubmitting(false);
        }}
      >
        {(props: FormikProps<FormValues>) => (
          <form onSubmit={props.handleSubmit} className="form w-100">
            <div className="input-group">
              <FormControl
                key="typeInput"
                value={props.values.username}
                type="text"
                className="form-control search border-right-0 transparent-bg pr-0"
                name="username"
                id="username"
                placeholder="Chatpartner suchen"
                onChange={(e) => {
                  props.handleChange(e);
                  props.submitForm();
                }}
              />
              <div className="input-group-append">
                <Button type="submit" className="input-group-text transparent-bg border-left-0">
                  <svg className="text-muted hw-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
}

export default SearchBar;
