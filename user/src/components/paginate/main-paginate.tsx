import ReactPaginate from 'react-paginate';

interface IProps {
  pageTotal: number;
  pageNumber: number;
  currentPage: number;
  setPage: (page: number) => void;
}
function MainPaginate({
  pageTotal, pageNumber, currentPage, setPage
}: IProps) {
  const handlePaginate = (data) => {
    if (data && data.selected >= 0) {
      setPage(data.selected + 1);
    }
  };
  return (
    <div style={{ position: 'relative', textAlign: 'center' }}>
      <ReactPaginate
        previousLabel="Vorherige"
        nextLabel="Nächste"
        breakLabel="..."
        breakClassName="break-me"
        pageCount={pageTotal / (pageNumber || 10)}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={handlePaginate}
        containerClassName="pagination"
        activeClassName="active"
        forcePage={currentPage - 1}
      />
    </div>
  );
}

export default MainPaginate;
