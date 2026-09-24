#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

export PYTHONIOENCODING="utf-8"

CBM_EXE="$(which codebase-memory-mcp 2>/dev/null || true)"
CRG_EXE="$(which code-review-graph 2>/dev/null || true)"

[ -n "$CBM_EXE" ] && CBM_STATUS="FOUND ($CBM_EXE)" || CBM_STATUS="NOT FOUND"
[ -n "$CRG_EXE" ] && CRG_STATUS="FOUND ($CRG_EXE)" || CRG_STATUS="NOT FOUND"

show_menu() {
    clear 2>/dev/null || true
    echo "==================================================="
    echo "       CBM + CRG GRAPH SYNC MANAGER (Linux/macOS)  "
    echo "==================================================="
    echo ""
    echo "Project : $REPO_ROOT"
    echo ""
    echo "CBM : $CBM_STATUS"
    echo "CRG : $CRG_STATUS"
    echo ""
    echo "[1] Quick Sync Both Graphs (Incremental)"
    echo "[2] Check Status of Both Graphs"
    echo "[3] Full Rebuild Both Graphs"
    echo "[4] Sync CBM Only"
    echo "[5] Sync CRG Only"
    echo "[6] Launch CBM Visualizer (Web UI)"
    echo "[7] Generate & View CRG Interactive Graph (HTML)"
    echo "[8] Exit"
    echo ""
}

while true; do
    show_menu
    read -rp "Select an option [1-8]: " choice
    case "$choice" in
        1)
            echo ""
            echo "==================================================="
            echo "[1/2] Updating CBM AST Knowledge Graph..."
            if [ -n "$CBM_EXE" ]; then
                "$CBM_EXE" cli index_repository --repo-path "$REPO_ROOT" --persistence true && echo "[OK] CBM graph updated." || echo "[ERROR] CBM sync failed."
            else
                echo "[SKIP] CBM : NOT FOUND"
            fi
            echo ""
            echo "[2/2] Updating CRG Blast Radius Graph..."
            if [ -n "$CRG_EXE" ]; then
                "$CRG_EXE" update --brief && echo "[OK] CRG graph updated." || echo "[ERROR] CRG sync failed."
            else
                echo "[SKIP] CRG : NOT FOUND"
            fi
            echo ""
            echo "SYNC COMPLETE"
            read -rp "Press Enter to continue..."
            ;;
        2)
            echo ""
            echo "==================================================="
            echo "Checking CBM Status..."
            if [ -n "$CBM_EXE" ]; then
                "$CBM_EXE" cli list_projects
            else
                echo "[SKIP] CBM : NOT FOUND"
            fi
            echo ""
            echo "Checking CRG Status..."
            if [ -n "$CRG_EXE" ]; then
                "$CRG_EXE" status
            else
                echo "[SKIP] CRG : NOT FOUND"
            fi
            read -rp "Press Enter to continue..."
            ;;
        3)
            echo ""
            echo "WARNING: This performs a full graph rebuild."
            read -rp "Proceed? (y/N): " confirm
            if [[ "$confirm" =~ ^[Yy]$ ]]; then
                echo "Rebuilding CBM..."
                [ -n "$CBM_EXE" ] && "$CBM_EXE" cli index_repository --repo-path "$REPO_ROOT" --persistence true
                echo "Rebuilding CRG..."
                [ -n "$CRG_EXE" ] && "$CRG_EXE" build --repo "$REPO_ROOT"
                echo "[OK] Rebuild complete."
            else
                echo "[WARN] Rebuild aborted."
            fi
            read -rp "Press Enter to continue..."
            ;;
        4)
            [ -n "$CBM_EXE" ] && "$CBM_EXE" cli index_repository --repo-path "$REPO_ROOT" --persistence true
            read -rp "Press Enter to continue..."
            ;;
        5)
            [ -n "$CRG_EXE" ] && "$CRG_EXE" update --brief
            read -rp "Press Enter to continue..."
            ;;
        6)
            echo ""
            echo "==================================================="
            echo "Starting CBM Visualizer Web Server..."
            if [ -n "$CBM_EXE" ]; then
                # Start CBM in background with UI enabled on port 9749
                pkill -f "codebase-memory-mcp --ui=true" 2>/dev/null || true
                nohup "$CBM_EXE" --ui=true --port=9749 > /tmp/cbm_ui.log 2>&1 &
                sleep 1
                echo ""
                echo "[OK] CBM Visualizer is LIVE at:"
                echo "     👉 http://localhost:9749"
                echo ""
                echo "To view in VS Code:"
                echo "  1. Press Ctrl+Shift+P -> 'Simple Browser: Show'"
                echo "  2. Enter: http://localhost:9749"
                echo "  Or check the VS Code Ports tab for port 9749."
            else
                echo "[SKIP] CBM : NOT FOUND"
            fi
            echo "==================================================="
            read -rp "Press Enter to continue..."
            ;;
        7)
            echo ""
            echo "==================================================="
            echo "Generating CRG Interactive HTML Graph..."
            if [ -n "$CRG_EXE" ]; then
                "$CRG_EXE" visualize
                # Start preview server on port 8080 if not running
                if ! pgrep -f "http.server 8080" > /dev/null 2>&1; then
                    nohup python3 -m http.server 8080 --directory "$REPO_ROOT/.code-review-graph" > /dev/null 2>&1 &
                fi
                echo ""
                echo "[OK] CRG Graph is ready at:"
                echo "     👉 http://localhost:8080/graph.html"
                echo "     File: $REPO_ROOT/.code-review-graph/graph.html"
                echo ""
                echo "To view in VS Code:"
                echo "  1. Press Ctrl+Shift+P -> 'Simple Browser: Show'"
                echo "  2. Enter: http://localhost:8080/graph.html"
            else
                echo "[SKIP] CRG : NOT FOUND"
            fi
            echo "==================================================="
            read -rp "Press Enter to continue..."
            ;;
        8)
            exit 0
            ;;
        *)
            echo "Invalid choice."
            sleep 1
            ;;
    esac
done
