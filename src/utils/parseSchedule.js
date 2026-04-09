/**
 * Parse post content to extract schedule information
 * Removes " - Append Schedule: {date}" from content and returns clean content + schedule
 * @param {string} content - Post content string
 * @returns {{ content: string, appendSchedule: string | null }}
 */
export const parseScheduleFromContent = (content) => {
  if (!content) return { content: content || '', appendSchedule: null };

  const scheduleRegex = /\s*-\s*Append Schedule:\s*(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/;
  const match = content.match(scheduleRegex);

  if (match) {
    const appendSchedule = match[1];
    const cleanContent = content.replace(scheduleRegex, '');
    return { content: cleanContent, appendSchedule };
  }

  return { content, appendSchedule: null };
};

/**
 * Apply schedule parsing to an array of posts
 * @param {Array} posts - Array of post objects
 * @returns {Array} Posts with parsed content and appendSchedule field
 */
export const parsePostsSchedule = (posts) => {
  if (!Array.isArray(posts)) return posts;

  return posts.map(post => {
    if (!post.content) return post;

    const { content, appendSchedule } = parseScheduleFromContent(post.content);
    return {
      ...post,
      content,
      appendSchedule
    };
  });
};
