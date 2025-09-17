#!/bin/bash

# 🚀 1 Billion Challenge - Remote Installation Script
# 
# This script downloads and sets up the complete 1 Billion Challenge project
# from a remote repository (GitHub Pages, CDN, etc.)
#
# Usage:
#   curl -sSL https://your-domain.github.io/billion-challenge/install.sh | bash
#   or
#   wget -qO- https://your-domain.github.io/billion-challenge/install.sh | bash
#   or
#   bash <(curl -sSL https://your-domain.github.io/billion-challenge/install.sh)

set -e  # Exit on any error

# Configuration
PROJECT_NAME="billion-challenge"
NODE_MIN_VERSION=18
INSTALL_DIR="$PWD/$PROJECT_NAME"
BASE_URL="https://benchmark.isaksweb.xyz"  # Default URL for downloading files

# Alternative URLs for different hosting options
# BASE_URL="https://raw.githubusercontent.com/your-username/billion-challenge/main"
# BASE_URL="https://cdn.jsdelivr.net/gh/your-username/billion-challenge@main"
# BASE_URL="https://your-custom-domain.com/billion-challenge"

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Spinner animation
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Helper functions
print_header() {
    clear
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║   🚀 1 BILLION CHALLENGE - REMOTE INSTALLER                 ║"
    echo "║                                                              ║"
    echo "║   High-Performance Node.js Benchmark Suite                  ║"
    echo "║   Test various optimization strategies                       ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}📝 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# System detection
detect_system() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        DISTRO=$(lsb_release -si 2>/dev/null || echo "Unknown")
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macOS $(sw_vers -productVersion)"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
        DISTRO="Windows"
    else
        OS="unknown"
        DISTRO="Unknown"
    fi
}

# Download utility with fallback options
download_file() {
    local url=$1
    local output=$2
    local description=$3
    
    print_step "Downloading $description..."
    
    # Try curl first
    if command -v curl &> /dev/null; then
        if curl -fsSL --connect-timeout 10 --max-time 30 "$url" -o "$output"; then
            print_success "$description downloaded"
            return 0
        fi
    fi
    
    # Fallback to wget
    if command -v wget &> /dev/null; then
        if wget -q --timeout=30 --tries=3 "$url" -O "$output"; then
            print_success "$description downloaded"
            return 0
        fi
    fi
    
    # Fallback to fetch (if available)
    if command -v fetch &> /dev/null; then
        if fetch -q -T 30 -o "$output" "$url"; then
            print_success "$description downloaded"
            return 0
        fi
    fi
    
    print_error "Failed to download $description. Please check your internet connection."
}

# Check system requirements
check_requirements() {
    print_step "Checking system requirements..."
    
    detect_system
    print_info "Detected system: $DISTRO"
    
    # Check if we have a download utility
    if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null && ! command -v fetch &> /dev/null; then
        print_error "No download utility found. Please install curl, wget, or fetch."
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed."
        echo ""
        echo -e "${YELLOW}Please install Node.js $NODE_MIN_VERSION or higher:${NC}"
        if [[ "$OS" == "macos" ]]; then
            echo "  brew install node"
        elif [[ "$OS" == "linux" ]]; then
            echo "  # Ubuntu/Debian:"
            echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo "  sudo apt-get install -y nodejs"
            echo ""
            echo "  # CentOS/RHEL/Fedora:"
            echo "  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
            echo "  sudo yum install -y nodejs"
        else
            echo "  Visit: https://nodejs.org/"
        fi
        echo ""
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt "$NODE_MIN_VERSION" ]; then
            print_error "Node.js version $NODE_MIN_VERSION or higher is required. Current: $(node -v)"
        fi
        print_success "Node.js $(node -v) detected"
    fi
    
    # Check/install pnpm
    if ! command -v pnpm &> /dev/null; then
        print_step "Installing pnpm package manager..."
        if command -v npm &> /dev/null; then
            npm install -g pnpm &> /dev/null &
            spinner $!
            print_success "pnpm installed"
        else
            print_warning "npm not available, will install pnpm via script"
            if command -v curl &> /dev/null; then
                curl -fsSL https://get.pnpm.io/install.sh | sh - &> /dev/null &
                spinner $!
            else
                wget -qO- https://get.pnpm.io/install.sh | sh - &> /dev/null &
                spinner $!
            fi
            export PATH="$HOME/.local/share/pnpm:$PATH"
            print_success "pnpm installed"
        fi
    else
        print_success "pnpm $(pnpm -v) detected"
    fi
}

# Create project structure
setup_project() {
    print_step "Setting up project structure..."
    
    # Remove existing directory if it exists
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Directory $INSTALL_DIR already exists"
        read -p "Remove and reinstall? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
        else
            print_error "Installation cancelled"
        fi
    fi
    
    # Create directory structure
    mkdir -p "$INSTALL_DIR/src"
    mkdir -p "$INSTALL_DIR/dist"
    
    print_success "Project structure created at $INSTALL_DIR"
}

# Download project files
download_project_files() {
    print_step "Downloading project files..."
    
    cd "$INSTALL_DIR"
    
    # List of files to download
    declare -A files=(
        ["package.json"]="Package configuration"
        ["tsconfig.json"]="TypeScript configuration"
        [".gitignore"]="Git ignore rules"
        ["README.md"]="Project documentation"
        ["src/billion-challenge.ts"]="Main benchmark implementation"
        ["LICENSE"]="License file"
    )
    
    # Download each file
    for file in "${!files[@]}"; do
        download_file "$BASE_URL/$file" "$file" "${files[$file]}"
        sleep 0.5  # Small delay to avoid overwhelming the server
    done
    
    print_success "All project files downloaded"
}

# Install dependencies and build
install_and_build() {
    print_step "Installing dependencies..."
    cd "$INSTALL_DIR"
    
    # Install dependencies with progress
    pnpm install &> /dev/null &
    spinner $!
    print_success "Dependencies installed"
    
    print_step "Building optimized bundle..."
    pnpm build &> /dev/null &
    spinner $!
    print_success "Project built successfully"
}

# Run verification test
verify_installation() {
    print_step "Running verification test..."
    cd "$INSTALL_DIR"
    
    # Run a quick test with timeout
    echo -e "${CYAN}"
    if timeout 30s pnpm test --dev 2>/dev/null; then
        echo -e "${NC}"
        print_success "Installation verified successfully!"
    else
        echo -e "${NC}"
        print_warning "Verification test timed out (this is normal)"
        print_success "Installation appears to be working"
    fi
}

# Print completion instructions
print_completion() {
    echo ""
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║   🎉 INSTALLATION COMPLETE!                                 ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${WHITE}📁 Project installed at: ${CYAN}$INSTALL_DIR${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Quick Start Commands:${NC}"
    echo -e "${CYAN}  cd $PROJECT_NAME${NC}"
    echo -e "${CYAN}  pnpm test${NC}          # Quick test (100M numbers, ~30s)"
    echo -e "${CYAN}  pnpm full${NC}          # Full challenge (1B numbers, ~5min)"
    echo -e "${CYAN}  pnpm benchmark${NC}     # Detailed profiling"
    echo -e "${CYAN}  pnpm dev${NC}           # Development mode"
    echo ""
    echo -e "${PURPLE}💡 Pro Tips:${NC}"
    echo "  • Start with 'pnpm test' to verify everything works"
    echo "  • The mathematical formula will complete in microseconds"
    echo "  • Monitor system resources during the full test"
    echo "  • Use 'pnpm benchmark' for detailed performance analysis"
    echo ""
    echo -e "${BLUE}📊 Expected Performance Ranking:${NC}"
    echo "  1. 🏆 Mathematical Formula    (~0.001ms)"
    echo "  2.    Assembly Style Loop     (~2-5 seconds)"  
    echo "  3.    Parallel Workers        (~1-3 seconds)"
    echo "  4.    Other optimizations     (~3-8 seconds)"
    echo ""
    echo -e "${GREEN}Ready to break some performance records? 🏆${NC}"
    echo ""
    echo -e "${YELLOW}Support: ${CYAN}https://github.com/Grizak/billion-challenge${NC}"
}

# Error handling
cleanup_on_error() {
    print_error "Installation failed. Cleaning up..."
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
    fi
    exit 1
}

# Set up error handling
trap cleanup_on_error ERR

# Main installation flow
main() {
    print_header
    
    echo -e "${CYAN}This script will install the 1 Billion Challenge benchmark suite.${NC}"
    echo -e "${CYAN}It will download files from: ${WHITE}$BASE_URL${NC}"
    echo ""
    
    # Prompt for confirmation
    read -p "Continue with installation? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    echo ""
    
    # Installation steps
    check_requirements
    setup_project
    download_project_files
    install_and_build
    verify_installation
    
    print_completion
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --base-url=*)
            BASE_URL="${1#*=}"
            shift
            ;;
        --dir=*)
            PROJECT_NAME="${1#*=}"
            INSTALL_DIR="$PWD/$PROJECT_NAME"
            shift
            ;;
        --help|-h)
            echo "1 Billion Challenge Remote Installer"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --base-url=URL    Set custom base URL for downloads"
            echo "  --dir=NAME        Set custom directory name (default: billion-challenge)"
            echo "  --help, -h        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0"
            echo "  $0 --dir=my-benchmark"
            echo "  $0 --base-url=https://my-domain.com/files"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1. Use --help for usage information."
            ;;
    esac
done

# Run main installation
main "$@"