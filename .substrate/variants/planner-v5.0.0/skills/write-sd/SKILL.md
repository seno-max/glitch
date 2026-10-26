---
name: write-sd
description: Write the Solution Definition document and OpenAPI spec from story context and codebase findings.
---

# Write the Solution Definition Documents

Your goal is to author a solution definition (SD) document for the given story. The document you produce is consumed by the next workflow, `executor`, which generates code from it so the SD document is effectively the contract the executor builds against, and its clarity directly shapes the quality of the code that follows.

There's no fixed template you must follow for the SD document. Pick whatever template is quickest to complete while still covering all the detail described below, and keep the depth proportionate to the story's complexity, a complex story earns a thorough SD, a simple one should stay lean rather than padded. Three rules are non-negotiable:

1. The SD document must be in markdown (`.md`) format. This document is mandatory for every story.
2. The two accompanying documents — the OpenAPI spec (`.yaml`) and the ER data model (`.mmd`) are optional. Produce the OpenAPI file only when the story introduces or changes an API, and the ER model only when the story introduces or changes a data model; skip either or both when the story doesn't call for them.
3. All of the details described below must be present in the SD document.

Throughout the steps below, you can use the `ask_human` tool to raise a question with the human to clear up ambiguity, fill a gap, or confirm a business rule you're unsure about. Strike a balance with it: don't defer every small decision to the user, but don't push ahead on an unclear or assumed business rule either. Use it deliberately.

Follow the steps below to author the solution definition document.

### Step 1: Identify the Story Type

- There are three story types, and the one you're given determines how the rest of this workflow behaves, so identify it first:
    - **New**: minimal existing codebase, built from scratch. You'll define all models and endpoints from the ground up.
    - **Extend**: added alongside existing code. Match the existing naming and patterns, and only add new endpoints and models, do not alter existing ones.
    - **Refactor**: modify an existing component. Reference the existing endpoint explicitly and describe what changes and why, while keeping all other paths intact.
- Read the story and settle its type before moving on, because the instructions in the following steps branch on it.

### Step 2: Apply the Type-Specific Instructions and Gather Context

- 2.1 For story type `New`:
    - From the story description and details, identify the tech stack for the story, including all dependencies and packages.
    - For the requirement in the Jira story, define the project directory structure.
    - For the requirement, define the infrastructure and environment setup by preparing a docker file and env file with the relevant details.
- 2.2 For story type `Extend`:
    - Find the existing dependency file to understand the tech stack of the existing feature's codebase, and plan the extended feature by matching and aligning with those same dependencies.
    - Learn the existing domain terminology by studying the existing models/entities, API routes, endpoints, model definitions, architecture patterns, and test structure.
- 2.3 For story type `Refactor`:
    - Identify the specific component being changed for the given requirement.
    - Find the existing dependency file to understand the tech stack of the existing feature's codebase, and align your plan with those same dependencies.
    - Learn the existing domain terminology by studying the existing models/entities, API routes, endpoints, model definitions, architecture patterns, and test structure.
    - Find the existing API definition document (OpenAPI) to identify the contract that needs to change and the consumers of that contract.
    - Identify the files and modules that consume this component/contract, so you understand its direct consumers.
    - Identify the dependencies of that component, so you understand the impact of the changes you're about to make.
    - Analyse the test module for that component to understand the current testing approach; what needs updating given the changes, and whether new test cases are required.

### Step 3: Write the Solution Definition Document

- 3.1 SD strategy for story type `New`:
    - Define all models, endpoints, and patterns from scratch.
    - Define all the tech stack and dependencies the solution requires.
    - Establish the terminology conventions.
    - Create the architecture and structure.
    - Cover the test module and directory structure if the story requires unit testing; skip the testing part entirely if it doesn't.
    - You have full freedom to design.
    - Save the SD document at `.substrate/docs/sd-docs/{{story_id}}.md`.
- 3.2 SD strategy for story type `Extend`:
    - Add new endpoints only. Do not alter the existing models or endpoints.
    - Cover the test module and directory structure if the story requires unit testing; skip the testing part entirely if it doesn't.
    - Use the existing terminology and patterns throughout.
    - Match the existing naming, structure, and validation approaches.
    - Design the new endpoints to align with the existing tech stack, models, and patterns.
    - Use the existing SD document at `.substrate/docs/sd-docs/{{story_id}}.md` and update it in place.
- 3.3 SD strategy for story type `Refactor`:
    - Reference the existing endpoint/component explicitly.
    - Describe what changes and why, being as specific as you can about the changes.
    - Call out what stays the same, and which changes are breaking versus non-breaking.
    - Update only the relevant paths in OpenAPI and keep all other paths intact.
    - Cover the test module and directory structure if the story requires unit testing; skip the testing part entirely if it doesn't.
    - Use the existing SD document at `.substrate/docs/sd-docs/{{story_id}}.md` and update it in place.
- General instructions for the API section of the SD document:
    - Provide a high-level table of all endpoints (method, path, operation ID, purpose).
    - Do not include detailed request/response examples; those belong in OpenAPI.
    - Do not duplicate validation rules; those belong in the OpenAPI schema.
    - Do include implementation guidance (patterns, business rules, special considerations).
    - Do reference the OpenAPI file at `.substrate/docs/api/openapi.yaml` as the source of truth for contracts.

### Step 4: Author the OpenAPI YAML File (Optional)

- General instructions for authoring the OpenAPI file. It should cover:
    - All endpoints from the SD, with operation IDs.
    - Every request/response schema with field types and validation rules.
    - 400, 401, 404, and 500 error responses where applicable.
    - `$ref` for all reusable schemas.
    - `example` values on every field.
- The SD document from the previous step carries the high-level detail and guidance for each endpoint; the exact detail belongs here in the OpenAPI file, specifically:
    - Exact field types, formats, and constraints (string, integer, boolean, uuid, date-time, etc.).
    - Min/max length, min/max values, and pattern/regex validations.
    - Required versus optional fields.
    - Detailed request/response examples (full JSON payloads).
    - All possible HTTP status codes and their response schemas.
    - Query parameters, path parameters, and headers.
    - Content-Type and Accept headers.
- Skip this step entirely if the story doesn't introduce or change an API.
- For story type `New`, you have full freedom to design the OpenAPI file, design the endpoints, routes, and contracts the story needs, effectively. Save the file at `<cwd>/repo/.substrate/docs/api/openapi.yaml`.
- For story type `Extend`, match the pattern of the existing OpenAPI file and the terminology used in its contracts, designing the new endpoint or route in line with those existing patterns. Use the existing OpenAPI file at `<cwd>/repo/.substrate/docs/api/openapi.yaml` and update it in place.
- For story type `Refactor`, redesign the existing endpoint or route based on the story details, and make sure you account for the impact on the rest of the contract, tweak the affected endpoints or routes effectively too. Use the existing OpenAPI file at `<cwd>/repo/.substrate/docs/api/openapi.yaml` and refine it in place.

### Step 5: Author the ER Data Model (Optional)

- Skip this step if the story doesn't require the ER model to be created, updated, or refined.
- For story type `New`, create an ER data model from scratch as a mermaid file, based on the analysis from Step 2. Save the file at `.substrate/docs/data-model/.mmd`.
- For story types `Extend` and `Refactor`, use the existing ER data model (mermaid file) at `.substrate/docs/data-model/.mmd` and update or refine it based on the analysis from Step 2.