You are a javascript web developer. We are going to perform a major refactor of this codebase, primarily removing the library mode and no longer exporting a Navigator. Instead, this will be a more traditional web application, set up using Vite conventions, without library mode.

Create a detailed plan for this, no backwards compatibility is required/ Clean slate - I want to get the foundation of the app right before adding features.

Currently, the docs outline a clear divide between working on the "core" @docs/core/ codebase and extending @docs/extend/ for applications that consume the library.

We are going to remove the entire /extend/ documentation, remove unnecessary code not needed for a non-library codebase. We obvioulsy want to keep flexibility for future improvements to the app, but remove any complexity that was added to support the library mode. The goal is to simplify the codebase.

Check the @docs/core/1.config.md for the external API that the app currently exposes. This will need to be refactored to be more of an internal API, and we will need to decide what parts of it we want to keep as a public API for users who want to build on top of the app in the future.

The docs will need to be overhauled also. The docs should be rewritten to reflect the new structure of the codebase and be moved to @docs/ Keep numbered filenames & footer navigation between docs, to guide the developer.

We are going to change the default theme @src/assets/sass/theme.scss to remove the current "blue" theme with the green one used in the exampels @docs/extend/examples/theme/green.scss @docs/core/7.theme.md is going to need to be redone to reference the single green theme, which is not intended to be extended.

The example recordings feature @docs/extend/5.features.md will be added as a core feature and implemented in @src/features/recordings/ as a vue plugin.

We also need to remove references to Navigator throughout the codebase, including in the documentation. The project is the "On Route App" and should be referred to as such. The codebase will be closed-source.

Create a plan for how we can simplify the codebase and create a sound foundation for future development. Feel free to ask questions.
