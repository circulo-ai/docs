import "server-only";

import { App, Octokit } from "octokit";

import {
  readGithubFeedbackConfig,
  type GithubFeedbackConfig,
} from "@/lib/github-feedback-config";

type RepositoryInfo = {
  id: string;
  discussionCategories: {
    nodes: Array<{
      id: string;
      name: string;
    }>;
  };
};

type DiscussionSummary = {
  id: string;
  url: string;
};

type CacheEntry = {
  octokit?: Promise<Octokit>;
  destination?: Promise<RepositoryInfo>;
};

const cacheByRepository = new Map<string, CacheEntry>();

const getRepositoryKey = (config: GithubFeedbackConfig) =>
  `${config.owner}/${config.repo}`;

const getCacheEntry = (config: GithubFeedbackConfig) => {
  const key = getRepositoryKey(config);
  const cached = cacheByRepository.get(key);
  if (cached) return cached;

  const created: CacheEntry = {};
  cacheByRepository.set(key, created);
  return created;
};

const getOctokit = async (config: GithubFeedbackConfig): Promise<Octokit> => {
  const cacheEntry = getCacheEntry(config);
  if (cacheEntry.octokit) {
    return cacheEntry.octokit;
  }

  cacheEntry.octokit = (async () => {
    const app = new App({
      appId: config.appId,
      privateKey: config.privateKey,
    });

    const { data } = await app.octokit.request(
      "GET /repos/{owner}/{repo}/installation",
      {
        owner: config.owner,
        repo: config.repo,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    return app.getInstallationOctokit(data.id);
  })();

  return cacheEntry.octokit;
};

const getFeedbackDestination = async (
  config: GithubFeedbackConfig,
): Promise<RepositoryInfo> => {
  const cacheEntry = getCacheEntry(config);
  if (cacheEntry.destination) {
    return cacheEntry.destination;
  }

  cacheEntry.destination = (async () => {
    const octokit = await getOctokit(config);
    const response = await octokit.graphql<{ repository?: RepositoryInfo }>(
      `
        query DocsFeedbackRepository($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            id
            discussionCategories(first: 50) {
              nodes {
                id
                name
              }
            }
          }
        }
      `,
      {
        owner: config.owner,
        repo: config.repo,
      },
    );

    if (!response.repository) {
      throw new Error(
        `Could not load GitHub repository ${config.owner}/${config.repo}.`,
      );
    }

    return response.repository;
  })();

  return cacheEntry.destination;
};

const findExistingDiscussion = async (
  octokit: Octokit,
  config: GithubFeedbackConfig,
  title: string,
): Promise<DiscussionSummary | null> => {
  const searchQuery = `${title} in:title repo:${config.owner}/${config.repo} author:@me`;

  const response = await octokit.graphql<{
    search: {
      nodes: DiscussionSummary[];
    };
  }>(
    `
      query DocsFeedbackSearch($searchQuery: String!) {
        search(type: DISCUSSION, query: $searchQuery, first: 1) {
          nodes {
            ... on Discussion {
              id
              url
            }
          }
        }
      }
    `,
    { searchQuery },
  );

  return response.search.nodes[0] ?? null;
};

export const createDiscussionThread = async (
  pageId: string,
  body: string,
): Promise<{ githubUrl: string }> => {
  const config = readGithubFeedbackConfig();
  if (!config) {
    throw new Error(
      "GitHub feedback integration is not configured. Set DOCS_FEEDBACK_GITHUB_OWNER, DOCS_FEEDBACK_GITHUB_REPO, GITHUB_APP_ID, and GITHUB_APP_PRIVATE_KEY.",
    );
  }

  const octokit = await getOctokit(config);
  const destination = await getFeedbackDestination(config);
  const category = destination.discussionCategories.nodes.find(
    (entry) => entry.name === config.category,
  );

  if (!category) {
    throw new Error(
      `Please create a "${config.category}" category in GitHub Discussions for ${config.owner}/${config.repo}.`,
    );
  }

  const title = `Feedback for ${pageId}`;
  const discussion = await findExistingDiscussion(octokit, config, title);

  if (discussion) {
    const response = await octokit.graphql<{
      addDiscussionComment: {
        comment: {
          url: string;
        };
      };
    }>(
      `
        mutation DocsFeedbackComment(
          $discussionId: ID!
          $body: String!
        ) {
          addDiscussionComment(
            input: { discussionId: $discussionId, body: $body }
          ) {
            comment {
              url
            }
          }
        }
      `,
      {
        discussionId: discussion.id,
        body,
      },
    );

    return {
      githubUrl: response.addDiscussionComment.comment.url,
    };
  }

  const response = await octokit.graphql<{
    createDiscussion: {
      discussion: {
        url: string;
      };
    };
  }>(
    `
      mutation DocsFeedbackCreateDiscussion(
        $repositoryId: ID!
        $categoryId: ID!
        $title: String!
        $body: String!
      ) {
        createDiscussion(
          input: {
            repositoryId: $repositoryId
            categoryId: $categoryId
            title: $title
            body: $body
          }
        ) {
          discussion {
            url
          }
        }
      }
    `,
    {
      repositoryId: destination.id,
      categoryId: category.id,
      title,
      body,
    },
  );

  return {
    githubUrl: response.createDiscussion.discussion.url,
  };
};
