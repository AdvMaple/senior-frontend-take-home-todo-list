# AI Session Prompts - Senior Frontend Engineer Take-Home Task

This document captures the significant human user prompts from the planning and implementation session (2026-11-08, 09:43-11:53 UTC). Each prompt is listed chronologically with a brief note on what aspect of the project it influenced (requirements, tooling, design, team structure, etc.).

## Prompts

1. "read the project and check the interview tasks for frontend engineer"
   _Establishes project scope and interview task requirements._

2. "plan for the take home tasks. I want the plan to also include steps to include the current session after we done. The plan should also include the folder structure, technologies used in the projects. After the plan is done, I want to have a file mention when I start this take home: 16:47PM and till when. The plan should separate into multiple files for: - init project - folder structure - as we are using react, use best react practices - as we are using tanstack, we should also use tanstack best practices. - the projects also need tests, so added that. - for backend, I recommend we use in-memory API"
   _Creates comprehensive project planning framework with emphasis on structure, best practices, and in-memory backend strategy._

3. "install these skill for this projects: https://tanstack.com/intent/registry/%40tanstack__router-core as we are using tanstack related skill. Note this down for ai-journey"
   _Introduces skill-based knowledge augmentation for TanStack tooling._

4. "init project plan look good, spawn sub agents, haiku to execute."
   _Authorizes team delegation and subagent spawning for execution phase._

5. "add eslint, prettier, ts lsp(if we don't have it yet) note this decision for ai-jounrey: static validatation for faster AI integration/ validation. Before proceed with any features, I want to write Tests Plan and requirements before we implement. -> This to ensure features requirement are met and code is implement by AI agents, but I will be reviewing the plan and requirement. I want the types in the projects to also be shared files instead of inlining of the style."
   _Establishes linting/formatting tooling, test-first methodology, and shared type file architecture._

6. "Add UI component decision to use shadcn: https://ui.shadcn.com/ as this also use tailwind as a base, so it would also be not violate the excersise rules. -> We use shared components to speed up development / trusted component design from 3rd parties"
   _Selects shadcn component library as UI foundation; justifies alignment with exercise constraints._

7. "I want to fix 1 by readd what we are missing. 3. fix the routing. 4. upgrade versions for me. If currnet node 20 is too old, we can use `nvm` to change to newer version. Add shadcn to the projects. I'm reviewing the current 08-requirements.md, meanwhile, work on the list above."
   _Directs feature fixes, routing configuration, dependency upgrades, and shadcn integration._

8. "I have add the intent tanstack related skills. The 08-requirements.md I have add the initial decision and review(v1), read and update the test plan for me to read. The deciison to add skills are: \"To teach the AI what we know about the business, code base\""
   _Confirms knowledge-base setup and requirements documentation v1 with rationale for skill-based AI training._

9. "mark the 08 requirements for V1 requirements"
   _Establishes V1 requirements version milestone._

10. "I also want to add a html mockup for what style/flow are we going for. use /frontend-design skill for this."
    _Introduces design mockup artifact using frontend-design skill._

11. "the UI look good for now. Add to the requreiemtn that after new user is created, then the users related hook shold be refresh. After todo is created/update/delete, data should be refresh. here the skills to install: npx skills add https://github.com/anthropics/skills --skill frontend-design install the skills first, so I could reload the pi session."
    _Adds data-refresh requirements for user/todo mutations; installs additional skill._

12. "another skills: npx skills add https://github.com/tanstack-skills/tanstack-skills --skill tanstack-query"
    _Installs TanStack Query skill for enhanced data-fetching patterns._

13. "I want to verify our frontend is performance, the test plan should include a way we could measure the frontend performances. I want to have a mock dataset for our fake backend to have 10_000 todo and 1000 users so we could similate our system underload + pagination tests. note this for the ai-jounrney"
    _Adds performance verification and load-testing requirements with large-scale mock data._

14. "add a requirement: A detail view of a user by ID. I want the detail view to allow user to change nightmode/darkmode. Preferences. View current user todos directly in their user detail pages. I have reviewed the 09 test plan. I also want to create a new 'user-design-decision' documents. the user-design-document shoud include thing that I have decided: - List pagination - Share state - Popup or message toast for errors."
    _Adds user detail page with theme preferences, dark mode, and related todos; creates design decision documentation._

15. "Move the open questions from various document to a separeate document 'open-questions' for me"
    _Centralizes open questions into dedicated documentation artifact._

16. "no need to update the mockup. THe open question default answers look good. spawn subagents to implement"
    _Approves design artifacts and green-lights implementation phase with subagent spawn._

17. "where are we in the progress?"
    _Requests progress status during implementation._

18. "stop the sub-agents, it has been running for while, check on the progress why does it so slow"
    _Escalates performance concern; halts subagent execution for investigation._

19. "prepare a final readme just like @senior-frontend-engineer/instructions.md required"
    _Directs final README deliverable aligned with exercise instructions._

20. "add a command like `npm run export` so it would zip this whole projects"
    _Adds utility script for project export/packaging._

21. "todo items should have margin to separate each item"
    _Refines the todo list readability after visual review._

22. "Add a test case for when todo title is too long, 120 character. Then it should overflow correctly. Note this as a manual tests findout"
    _Adds a long-title regression test and a real-browser layout check. The browser check exposed an omitted Tailwind source path, which was fixed and documented in `manual-test-findings.md`._

23. "When changing pageSize from 5 to 25, the app reload and still show 5"
    _Identifies a stale-state navigation bug. The review resulted in a regression test and a single source of pagination state updates._

24. "When we change the pagination, we are at the bottom of the page, but after change it, it jump to the start of the page. The page position should stay the same. Not jumped. Also the sorting by newest/oldest don't work."
    _Drives browser-led QA of route navigation. Preserving scroll and removing duplicate stale navigation fixed both issues._

25. "fix the caret in the select input of the pagination"
    _Adds an explicit accessible visual affordance to the native page-size control._

26. "After I just created user -> navigate back to 'todo' route. The filter show my userId instead of my userName" and "All places that show userId should use userName instead"
    _Establishes the final UI rule: user-facing text always shows `username`, never a raw `userId`. This led to direct selected-user lookup, API-provided assignee usernames, route/component tests, and a browser check._

27. "looking good now, finalize the projects, finish the ai jounrney requirement"
    _Triggers this final documentation review, clean export, and complete verification pass._
