// The backend's SearchUserQuery, with the page fields it inherits from PageQuery.
export type SearchUserQuery = {
  username: string;
  pageNumber: number;
  pageSize: number;
};
