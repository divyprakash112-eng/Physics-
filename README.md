
# NEET AARAMBH — Physics Test Series 2027

Static website for the NEET AARAMBH Physics Test Series 2027.

## Features

- 50 scheduled tests
- 31 chapter-wise tests
- 9 cumulative mixed tests
- 10 full-syllabus mocks
- Phase 1 and Phase 2 schedule
- India Standard Time (Asia/Kolkata)
- Live, upcoming and previous test statuses
- Countdown to the next test
- Search by test number, topic and chapter
- Test category filters
- Syllabus detail popup
- CBT file availability check
- Responsive mobile and desktop design
- Planner PDF link
- GitHub Pages deployment
- No backend or login required for the schedule

## Project structure

```text
/
├── index.html
├── 404.html
├── README.md
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js
│       ├── tests.js
│       └── app.js
├── planner/
│   └── NEET-AARAMBH-Physics-Test-Series-Planner-2027.pdf
└── tests/
    ├── test-01.html
    ├── test-02.html
    └── ...
    └── test-50.html
```

## GitHub Pages deployment

1. Create a new GitHub repository.
2. Create each folder and file using the paths above.
3. Upload the planner PDF using the exact filename specified above.
4. Open Settings → Pages.
5. Select Deploy from a branch.
6. Choose the `main` branch and `/ (root)`.
7. Save and wait for GitHub Pages to publish the site.

## CBT papers

The schedule references the following paths:

`tests/test-01.html` through `tests/test-50.html`

Each file must contain its own actual examination interface and question data. The website does not automatically generate questions from the syllabus.

## Test timing

Timezone: Asia/Kolkata

Scheduled start: 10:00 AM IST

Scheduled end: 10:00 PM IST

Upcoming tests are disabled in the website interface. Previous papers can be opened for practice if their files have been uploaded.

## Security

This is a static website. Browser-side schedule checks are for user interface behaviour only.

GitHub Pages cannot protect public CBT files from direct access. Real authentication, protected questions, server-side submissions and secure result storage require a backend.

## Syllabus notice

The schedule reflects the supplied Physics Test Series Planner 2027. Verify final topic coverage against the latest official NEET syllabus before conducting tests.
