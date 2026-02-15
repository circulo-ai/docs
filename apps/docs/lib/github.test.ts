import { beforeEach, describe, expect, it, vi } from "vitest";

const graphqlMock = vi.fn(
  async (document: string, variables: Record<string, unknown>) => {
    if (document.includes("DocsFeedbackRepository")) {
      return {
        repository: {
          id: "repo-1",
          discussionCategories: {
            nodes: [
              {
                id: "category-1",
                name: "Docs Feedback",
              },
            ],
          },
        },
      };
    }

    if (document.includes("DocsFeedbackSearch")) {
      if ("query" in variables) {
        throw new Error(
          '[@octokit/graphql] "query" cannot be used as variable name',
        );
      }

      return {
        search: {
          nodes: [
            {
              id: "discussion-1",
              url: "https://github.com/discussion/1",
            },
          ],
        },
      };
    }

    if (document.includes("DocsFeedbackComment")) {
      return {
        addDiscussionComment: {
          comment: {
            url: "https://github.com/discussion/1#comment-1",
          },
        },
      };
    }

    throw new Error(`Unexpected GraphQL document: ${document}`);
  },
);

const installationOctokit = {
  graphql: graphqlMock,
};

const requestMock = vi.fn(async () => ({ data: { id: 99 } }));

vi.mock("octokit", () => {
  class App {
    octokit = {
      request: requestMock,
    };

    getInstallationOctokit = vi.fn(async () => installationOctokit);
  }

  return {
    App,
    Octokit: class {},
  };
});

vi.mock("server-only", () => ({}));

vi.mock("@/lib/github-feedback-config", () => ({
  readGithubFeedbackConfig: vi.fn(() => ({
    owner: "acme",
    repo: "docs",
    category: "Docs Feedback",
    appId: "123",
    privateKey: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
  })),
}));

describe("github feedback discussion creation", () => {
  beforeEach(() => {
    graphqlMock.mockClear();
    requestMock.mockClear();
  });

  it("uses a non-reserved graphql variable name for discussion search", async () => {
    const { createDiscussionThread } = await import("@/lib/github");

    await expect(
      createDiscussionThread("/docs/page", "[Helpful] Looks good"),
    ).resolves.toEqual({
      githubUrl: "https://github.com/discussion/1#comment-1",
    });

    const searchCall = graphqlMock.mock.calls.find(([document]) =>
      String(document).includes("DocsFeedbackSearch"),
    );

    expect(searchCall).toBeDefined();
    if (!searchCall) return;

    const [document, variables] = searchCall as [
      string,
      Record<string, unknown>,
    ];

    expect(document).toContain("$searchQuery: String!");
    expect(document).toContain("query: $searchQuery");
    expect(variables).toHaveProperty("searchQuery");
    expect(variables).not.toHaveProperty("query");
  });
});
