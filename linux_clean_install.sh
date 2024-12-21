# Script to quickly fresh-install note-manager

# 1- Remove existing installation if exists
# 2- Delete 'out' folder
# 3- Run 'npm make' to create new artifact
# 4- Install the newly created artifact
# 5- Launch the app
(sudo apt remove note-manager || true) && (rm -rf out || true) && npm run make && sudo apt install ./out/make/deb/x64/note-manager_1.0.0_amd64.deb && note-manager