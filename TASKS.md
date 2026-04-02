1/ Squash

We are currently on the git branch called "dev". Use git to create a new branch from master called "merge". Compare this to the "dev" branch and create a PR-ready squashed commit with appropriate title & body that summarises changes. Use commit titles like:

- fix: fix bug in feature X
- feat: add new feature Y
- docs: update documentation for feature Z
- bump: update dependencies for feature A

2/ Improve the top navbar @src/components/ui/top.vue button icons. Currently record uses a "short" icon which means that the button is not as tall, making the button label not be inline with the other buttons.

Change the button component so that the icon container is a fixed height, and the icons are centered within that container. This should make all buttons the same height and the labels should be inline. Also I notice that the Record button has a few issues:

- No hover state like other buttons.
- The label text has a capital R, while all other buttons are in allcaps. Allcaps should be used for all button labels for consistency. The Recording label appears in red, but other buttons like locate use the primary bright green.
- Has a fixed Icon: change this to the @ogis/icons circle & pause-circle to give a visual indication of recording status. The circle icon should be used when not recording, and the pause-circle icon should be used when recording.
- When recording is active the label and icon should appear bright green, like the locate button, to indicate that recording is active. When not recording the label and icon should appear in the default color to indicate that recording is inactive.

I want to fix these issues by convention, through improving components that makes the UI feel more consistent to avoid issues like these in the future.
