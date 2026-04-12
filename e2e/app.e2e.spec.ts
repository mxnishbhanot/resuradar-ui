import { test, expect } from '@playwright/test';
import {
  attachPdf,
  expectRoute,
  mockApi,
  mockGoogleScript,
  mockLoggedInUser,
  mockMatchAnalysis,
  mockResumeDashboard,
  mockUploadAnalysis,
} from './helpers/app';

test.beforeEach(async ({ page }) => {
  await mockGoogleScript(page);
  await mockApi(page);
});

test('renders core public routes', async ({ page }) => {
  await expectRoute(page, '/upload', 'Transform Your Resume with AI');
  await expectRoute(page, '/scan', 'Match Resume to Job Description');
  await expectRoute(page, '/contact', 'Contact Us');
});

test('submits the contact form successfully', async ({ page }) => {
  await page.goto('/contact');

  await page.getByPlaceholder('Enter your name').fill('Playwright Tester');
  await page.getByPlaceholder('you@example.com').fill('tester@example.com');
  await page.getByPlaceholder('How can we help you?').fill('Please help me validate the app.');
  await page.getByRole('button', { name: /send message/i }).click();

  await expect(page.getByRole('button', { name: /send message/i })).toHaveCount(0);
});

test('uploads a resume and navigates to the analysis results', async ({ page }) => {
  await mockLoggedInUser(page);
  await mockUploadAnalysis(page);

  await page.goto('/upload');
  await attachPdf(page);

  await expect(page).toHaveURL(/\/analysis$/);
  await expect(page.getByRole('heading', { name: 'Resume Analysis' })).toBeVisible();
  await expect(page.getByText('Executive Summary')).toBeVisible();
  await expect(page.getByRole('button', { name: /upgrade to pro/i })).toBeVisible();
});

test('matches a resume to a job description and shows match results', async ({ page }) => {
  await mockLoggedInUser(page);
  await mockMatchAnalysis(page);

  await page.goto('/scan');
  await attachPdf(page, '#fileInput');
  await page.getByPlaceholder('Paste the full job description here...').fill(
    'We need a frontend engineer with Angular, TypeScript, REST API experience, and strong collaboration skills.'
  );

  await page.getByRole('button', { name: /analyze match/i }).click();

  await expect(page).toHaveURL(/\/match-results$/);
  await expect(page.getByRole('heading', { name: 'Job Match Analysis' })).toBeVisible();
  await expect(page.getByText('Match Summary')).toBeVisible();
});

test('shows the unified resume dashboard with builder, ATS, and match cards', async ({ page }) => {
  await mockLoggedInUser(page);
  await mockResumeDashboard(page);

  await page.goto('/custom-list');

  await expect(page.getByRole('heading', { name: 'My Resumes' })).toBeVisible();
  await expect(page.getByText('Senior Frontend Engineer')).toBeVisible();
  await expect(page.getByText('ats-resume.pdf')).toBeVisible();
  await expect(page.getByText('match-resume.pdf')).toBeVisible();
});
