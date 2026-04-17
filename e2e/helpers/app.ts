import { Page, Route, expect } from '@playwright/test';

export const mockGoogleScript = async (page: Page) => {
  await page.addInitScript(() => {
    const noop = () => {};
    (window as any).google = {
      accounts: {
        id: {
          initialize: noop,
          prompt: noop,
          disableAutoSelect: noop,
        },
        oauth2: {
          initTokenClient: () => ({
            requestAccessToken: noop,
          }),
        },
      },
    };
  });
};

export const mockLoggedInUser = async (
  page: Page,
  overrides: Record<string, unknown> = {}
) => {
  await page.addInitScript((user) => {
    localStorage.setItem('user', JSON.stringify(user));
  }, {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    picture: 'https://example.com/avatar.png',
    isPremium: false,
    joinedDate: new Date().toISOString(),
    resumeCount: 2,
    ...overrides,
  });
};

export const mockApi = async (page: Page) => {
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/avatar.png',
        isPremium: false,
        hasActivePremium: false,
        joinedDate: new Date().toISOString(),
        resumeCount: 2,
        standardUsed: 0,
        standardLimit: 5,
        jdUsed: 0,
        jdLimit: 1,
        freeBuilderTemplates: ['modern', 'corporate', 'faang'],
      }),
    });
  });

  await page.route('**/api/contact', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: "Your message has been received. We'll get back to you soon!",
      }),
    });
  });

  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
};

export const mockUploadAnalysis = async (page: Page) => {
  await page.route('**/api/resumes/upload', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          filename: 'resume.pdf',
          score: 82,
          free_feedback: {
            strengths: ['Strong project impact', 'Clear experience section', 'Relevant skills'],
            improvements: ['Tighten summary', 'Add more metrics', 'Improve ATS keywords'],
            summary: 'Solid resume with a few opportunities to make achievements sharper.',
          },
          premium_feedback: {
            detailed_suggestions: ['Add measurable outcomes to recent roles'],
            rewrites: ['Increased conversion by 20% through workflow optimization'],
            portfolio_tips: ['Add a case study with screenshots'],
            keywords: ['Angular', 'Node.js', 'MongoDB'],
            professional_level: 'Mid-Level',
          },
        },
      }),
    });
  });
};

export const mockMatchAnalysis = async (page: Page) => {
  await page.route('**/api/resumes/match', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          filename: 'resume.pdf',
          free_feedback: {
            match_score: 76,
            match_level: 'Good',
            summary: 'Your resume aligns well with the role with a few notable gaps.',
            strengths: ['Strong backend fundamentals', 'Relevant product work', 'Good tooling overlap'],
            gaps: ['Need stronger cloud keywords', 'More quantified achievements', 'Highlight API ownership'],
          },
          premium_feedback: {
            keyword_analysis: {
              total_keywords_in_jd: 20,
              matched_keywords: 15,
              missing_keywords: ['AWS', 'Redis'],
            },
            role_fit_breakdown: {
              technical_skills_fit: 82,
              experience_fit: 74,
              education_fit: 88,
              soft_skills_fit: 70,
              overall_fit: 76,
            },
            recommendations: ['Add AWS work to recent role bullets'],
            suggested_rewrites: [
              {
                original: 'Worked on backend APIs',
                suggestion: 'Built and maintained Node.js APIs serving high-volume client traffic',
              },
            ],
          },
        },
      }),
    });
  });
};

export const mockResumeDashboard = async (page: Page) => {
  await page.route('**/api/custom-resume/all', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        resumes: [
          {
            _id: '507f1f77bcf86cd799439011',
            personal: { headline: 'Senior Frontend Engineer' },
            isDraft: true,
            updatedAt: '2026-04-12T12:00:00.000Z',
            completionPercentage: 67,
          },
        ],
      }),
    });
  });

  await page.route('**/api/resumes/ats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            _id: '507f1f77bcf86cd799439012',
            filename: 'ats-resume.pdf',
            updatedAt: '2026-04-11T12:00:00.000Z',
            score: 79,
            analysis: { score: 79, free_feedback: { summary: 'ATS ready' } },
          },
        ],
      }),
    });
  });

  await page.route('**/api/resumes/jd', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            _id: '507f1f77bcf86cd799439013',
            filename: 'match-resume.pdf',
            updatedAt: '2026-04-10T12:00:00.000Z',
            score: 84,
            analysis: {
              free_feedback: {
                match_score: 84,
                match_level: 'Strong',
                summary: 'Great match',
                strengths: ['API design'],
                gaps: ['Minor keyword gaps'],
              },
              premium_feedback: {
                keyword_analysis: { total_keywords_in_jd: 10, matched_keywords: 8, missing_keywords: ['Redis'] },
                role_fit_breakdown: {
                  technical_skills_fit: 85,
                  experience_fit: 84,
                  education_fit: 80,
                  soft_skills_fit: 82,
                  overall_fit: 84,
                },
                recommendations: ['Add Redis'],
                suggested_rewrites: [],
              },
            },
          },
        ],
      }),
    });
  });
};

export const attachPdf = async (page: Page, selector = 'input[type="file"]') => {
  await page.setInputFiles(selector, {
    name: 'resume.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 mock pdf'),
  });
};

export const expectRoute = async (page: Page, route: string, title: string) => {
  await page.goto(route);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
};
