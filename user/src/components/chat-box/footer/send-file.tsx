import Dropzone from 'react-dropzone';

interface IProps {
  onDrop: Function;
  type: string;
}

function SendFile({ onDrop, type }: IProps) {
  return (
    <Dropzone onDrop={(acceptedFiles) => onDrop(acceptedFiles)}>
      {({ getRootProps, getInputProps }) => (
        <a className="dropdown-item" href="#" {...getRootProps()}>
          <input {...getInputProps()} />
          <svg className="hw-20 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {type === 'media' && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
            )}
            {type === 'file' && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
            )}
          </svg>
          <span>
            {type === 'media' && 'Gallery'}
            {type === 'file' && 'Document'}
          </span>
        </a>
      )}
    </Dropzone>
  );
}

export default SendFile;
