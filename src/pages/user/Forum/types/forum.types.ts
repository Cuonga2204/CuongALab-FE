export interface ForumUser {
  id: string;
  name: string;
  avatar?: string;
}

export interface TopicItem {
  id: string;
  title: string;
  content: string;
  course_id: string;
  user_id: ForumUser;
  tags: string[];
  attachments?: string[];
  upvotes: string[];
  createdAt: string;
  reply_count: number;
}

export interface ReplyItem {
  id: string;
  content: string;
  parent_id: string | null;
  user_id: ForumUser;
  upvotes: string[];
  replies: ReplyItem[];
  createdAt: string;
}

export interface TopicDetailResponse {
  topic: TopicItem;
  replies: ReplyItem[];
}

export interface CreateTopicPayload {
  userId: string;
  title: string;
  content: string;
  course_id?: string | null;
}

export interface CreateReplyPayload {
  topicId: string;
  parentId?: string | null;
  userId: string;
  content: string;
}

export interface UpvoteTopicPayload {
  topicId: string;
  userId: string;
}

export interface UpvoteReplyPayload {
  replyId: string;
  userId: string;
}

export interface UpdateTopicPayload {
  title?: string;
  content?: string;
  userId: string;
}

export interface DeleteTopicPayload {
  topicId: string;
  userId: string;
}

export interface UpdateReplyPayload {
  replyId: string;
  content: string;
  userId: string;
}

export interface DeleteReplyPayload {
  replyId: string;
  userId: string;
}
