import { HasObjectId } from './has-object-id';

export type ITag = {
  name: string,
  createdAt: Date;
}

export type ITagCount = Omit<ITag, 'createdAt'> & {count: number}

export type ITagCountHasId = ITagCount & HasObjectId

export type ITagsSearchApiv1Result = {
  ok: boolean,
  tags: string[]
}

export type ITagsListApiv1Result = {
  ok: boolean,
  data: ITagCountHasId[],
  totalCount: number,
}
