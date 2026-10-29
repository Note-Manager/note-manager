#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/Note-Manager/note-manager.git"
PACKAGE_NAME="note-manager"
PRODUCT_NAME="Note Manager"

target_dir="$HOME/$PACKAGE_NAME"
ref=""

usage() {
    cat <<EOF
Usage: install-macos.sh [--dir <folder>] [--ref <branch-or-tag>]

Builds $PRODUCT_NAME from source and installs it into /Applications
(or ~/Applications when /Applications is not writable).
Run from a $PRODUCT_NAME checkout, it builds that checkout.
Otherwise it clones $REPO_URL into --dir (default: $target_dir).
--ref checks out a branch or tag before building (default for a clone: main).
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
    require_command git "Install the Xcode Command Line Tools with 'xcode-select --install'."
    require_command node "Install Node.js 22.17+ or 24+ from https://nodejs.org/"
    require_command npm "npm is installed together with Node.js."
    node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major >= 24 || (major === 22 && minor >= 17) ? 0 : 1)' \
        || fail "Node.js $(node -v) is not supported. Use Node.js 22.17+ or 24+."
    if pgrep -x "$PRODUCT_NAME" >/dev/null 2>&1; then
        fail "$PRODUCT_NAME is running. Quit it and run the script again."
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
    step "Building (make)"
    npm run make
}

applications_dir() {
    if [ -w /Applications ]; then
        echo /Applications
    else
        mkdir -p "$HOME/Applications"
        echo "$HOME/Applications"
    fi
}

install_app() {
    local app destination
    app="$(find "$source_dir/out" -maxdepth 2 -type d -name "$PRODUCT_NAME.app" | head -n 1)"
    [ -n "$app" ] || fail "No $PRODUCT_NAME.app was built in out/."
    destination="$(applications_dir)/$PRODUCT_NAME.app"
    step "Installing into $destination"
    rm -rf "$destination"
    ditto "$app" "$destination"
    echo "The DMG and ZIP packages are in $source_dir/out/make."
    step "Starting $PRODUCT_NAME"
    open "$destination"
}

main() {
    parse_args "$@"
    check_prerequisites
    prepare_source
    build
    install_app
    step "$PRODUCT_NAME $(node -p "require('./package.json').version") is installed"
}

main "$@"
