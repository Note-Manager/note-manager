#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/Note-Manager/note-manager.git"
PACKAGE_NAME="note-manager"
PRODUCT_NAME="Note Manager"
LOCAL_APP_DIR="$HOME/.local/share/$PACKAGE_NAME"
LOCAL_BIN="$HOME/.local/bin/$PACKAGE_NAME"
DESKTOP_FILE="$HOME/.local/share/applications/$PACKAGE_NAME.desktop"

target_dir="$HOME/$PACKAGE_NAME"
ref=""

usage() {
    cat <<EOF
Usage: install-linux.sh [--dir <folder>] [--ref <branch-or-tag>]

Builds $PRODUCT_NAME from source and installs it.
Run from a $PRODUCT_NAME checkout, it builds that checkout.
Otherwise it clones $REPO_URL into --dir (default: $target_dir).
--ref checks out a branch or tag before building (default for a clone: main).
On Debian and Ubuntu it builds and installs the DEB package with apt.
On other distributions it installs the packaged app for the current user.
EOF
}

fail() {
    echo "Error: $*" >&2
    exit 1
}

step() {
    printf "\n==> %s\n" "$*"
}

parse_args() {
    while [ $# -gt 0 ]; do
        case "$1" in
            --dir|--ref)
                [ $# -ge 2 ] || fail "$1 needs a value"
                if [ "$1" = "--dir" ]; then target_dir="$2"; else ref="$2"; fi
                shift 2
                ;;
            -h|--help) usage; exit 0 ;;
            *) usage >&2; fail "Unknown option: $1" ;;
        esac
    done
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "$1 is required. $2"
}

check_prerequisites() {
    require_command git "Install Git from your package manager."
    require_command node "Install Node.js 22.17+ or 24+ from https://nodejs.org/"
    require_command npm "npm is installed together with Node.js."
    node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major >= 24 || (major === 22 && minor >= 17) ? 0 : 1)' \
        || fail "Node.js $(node -v) is not supported. Use Node.js 22.17+ or 24+."
    if pgrep -x "$PACKAGE_NAME" >/dev/null 2>&1; then
        fail "$PRODUCT_NAME is running. Close it and run the script again."
    fi
}

is_note_manager() {
    [ -f "$1/package.json" ] && grep -q "\"name\": \"$PACKAGE_NAME\"" "$1/package.json"
}

script_checkout() {
    local script="${BASH_SOURCE[0]:-}"
    [ -f "$script" ] || return 1
    local root
    root="$(cd "$(dirname "$script")/.." && pwd)"
    is_note_manager "$root" && echo "$root"
}

switch_ref() {
    [ -d "$source_dir/.git" ] || fail "$source_dir is not a Git clone, so --ref cannot be used."
    step "Checking out $1"
    git -C "$source_dir" fetch --tags origin
    git -C "$source_dir" checkout "$1"
    if git -C "$source_dir" show-ref --verify --quiet "refs/remotes/origin/$1"; then
        git -C "$source_dir" merge --ff-only "origin/$1"
    fi
}

prepare_source() {
    if source_dir="$(script_checkout)"; then
        step "Using the checkout in $source_dir"
        if [ -n "$ref" ]; then switch_ref "$ref"; fi
        return
    fi
    source_dir="$target_dir"
    if [ ! -e "$source_dir" ]; then
        step "Cloning $REPO_URL into $source_dir"
        git clone --branch "${ref:-main}" "$REPO_URL" "$source_dir"
        return
    fi
    is_note_manager "$source_dir" || fail "$source_dir exists and is not a $PRODUCT_NAME checkout. Choose another folder with --dir."
    switch_ref "${ref:-main}"
}

build() {
    cd "$source_dir"
    step "Installing dependencies"
    rm -rf out
    npm ci
    step "Building ($1)"
    npm run "$1"
}

ensure_deb_tools() {
    command -v fakeroot >/dev/null 2>&1 && return
    step "Installing fakeroot, which the DEB build needs"
    sudo apt-get update
    sudo apt-get install -y fakeroot
}

install_deb() {
    local deb
    deb="$(find "$source_dir/out/make/deb" -name "*.deb" | head -n 1)"
    [ -n "$deb" ] || fail "No DEB package was built in out/make/deb."
    step "Installing $(basename "$deb")"
    if dpkg -s "$PACKAGE_NAME" >/dev/null 2>&1; then
        sudo apt-get remove -y "$PACKAGE_NAME"
    fi
    sudo apt-get install -y "$deb"
}

install_for_user() {
    local packaged
    packaged="$(find "$source_dir/out" -maxdepth 1 -type d -name "$PRODUCT_NAME-linux-*" | head -n 1)"
    [ -n "$packaged" ] || fail "No packaged app was built in out/."
    step "Installing into $LOCAL_APP_DIR"
    rm -rf "$LOCAL_APP_DIR"
    mkdir -p "$(dirname "$LOCAL_APP_DIR")" "$(dirname "$LOCAL_BIN")" "$(dirname "$DESKTOP_FILE")"
    cp -R "$packaged" "$LOCAL_APP_DIR"
    ln -sf "$LOCAL_APP_DIR/$PACKAGE_NAME" "$LOCAL_BIN"
    cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=$PRODUCT_NAME
Exec="$LOCAL_APP_DIR/$PACKAGE_NAME" %F
Icon=$LOCAL_APP_DIR/resources/Icons/$PACKAGE_NAME.png
Categories=Utility;TextEditor;
Terminal=false
EOF
    case ":$PATH:" in
        *":$(dirname "$LOCAL_BIN"):"*) ;;
        *) echo "Add $(dirname "$LOCAL_BIN") to PATH to start $PRODUCT_NAME with '$PACKAGE_NAME'." ;;
    esac
}

launch() {
    if [ -z "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then
        echo "$PRODUCT_NAME is installed. Start it from your desktop's app menu."
        return
    fi
    step "Starting $PRODUCT_NAME"
    nohup "$1" >/dev/null 2>&1 &
}

main() {
    parse_args "$@"
    check_prerequisites
    prepare_source
    if command -v apt-get >/dev/null 2>&1; then
        ensure_deb_tools
        build make
        install_deb
        launch "$PACKAGE_NAME"
    else
        build package
        install_for_user
        launch "$LOCAL_BIN"
    fi
    step "$PRODUCT_NAME $(node -p "require('./package.json').version") is installed"
}

main "$@"
