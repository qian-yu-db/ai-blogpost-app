Goals: develop a modern full-stack web agentic app to help me to plan, draft, and write technical blogpost for medium of substack

What is app will do:

* Have 3 tabs: planning, drafting, and publish
* The planning tab can do the following: 
    * text box for writer to add a paragraph or bullets of the blogpost abstract and main outlines 
    * a menu to select one or more target reader persona (Data engineers, Data scientist, AI engineers, data analyist), 
    * a menu to select the technical detail level of the blogpost
    * a menu to select the length of the blogpost (1 mins read, 5 mins read, etc)
    * a menul to select a few writting style
    * A reference / resource input box to allow write to add local code (.py file, notebooks) or repo link, reference document links
    * A generat draft button to submit the job for the agent to write a draft. The agent will take write's inputs above and generate a well-written draft, the agent should can also perform web research in addition to use provided reference. But ensure the source are captioned. I will provide an existing skill for blog drat writing in addition to the instructions
* The drafting tab for writer to review the draft, make corrections
    * This is interactive and iterative UX, write make some edit ask agent to give feedback and recommendations
    * It should have common feature of grammar, spelling, reference link other commong writing fixes
    * It should show statistic of word counts
* Publish tab
    * It show the preview of final draft and statistics
    * writer have choice of save as a markdown file or pdf file


Existing available claude skill to use:

* use the ./tech-blog-helper/ for blog drafting and writing
* use /git-worktree skill if you need to create feature branch for development of this app
* use tasks if you don't need to create feature branch

Tech stack choices:

Full stack app, use modern stack
* Frontend: React + typescript, vite with rolldown, etc
* Backend: fastapi, claude agent sdk, Uvicorn
