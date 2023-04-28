import { Formik, FormikHelpers, FormikProps } from 'formik';
import { Button, FormControl } from 'react-bootstrap';
import * as Yup from 'yup';

interface IProps {
  handleSearch;
}
interface FormValues {
  text: string;
}

const schema = Yup.object().shape({
  text: Yup.string().required('Text is required')
});
function SearchBar({ handleSearch }: IProps) {
  return (
    <div className="container-xl py-2 px-0 px-md-3">
      <Formik
        validationSchema={schema}
        initialValues={{ text: '' }}
        onSubmit={async (values: FormValues, formikHelpers: FormikHelpers<FormValues>) => {
          handleSearch(values);
          formikHelpers.setSubmitting(false);
        }}
      >
        {(props: FormikProps<FormValues>) => (
          <form onSubmit={props.handleSubmit}>
            <div className="input-group bg-light">
              <FormControl
                key="typeInput"
                value={props.values.text}
                type="text"
                className="form-control form-control-md border-right-0 transparent-bg pr-0"
                name="text"
                id="text"
                placeholder="Nachrichten suchen"
                onChange={props.handleChange.bind(this)}
                onKeyPress={() => props.handleSubmit}
              />

              <div className="input-group-append">
                <Button type="submit" className="input-group-text transparent-bg border-left-0">
                  <svg className="hw-20 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
