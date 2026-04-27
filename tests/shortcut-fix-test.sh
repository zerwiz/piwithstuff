#!/bin/bash

FILE="/home/zerwiz/piwithstuff/.pi/npm/node_modules/@kaiserlich-dev/pi-session-search/extensions/index.ts"

echo "====================================="
echo "Testing Shortcut Fix (ctrl+f -> shift+f)"
echo "====================================="
echo ""

echo "1. Current shortcut in extension:"
grep "registerShortcut" "$FILE" 2>/dev/null || echo "   Not found"

echo ""
echo "2. Expected output:"
echo "   pi.registerShortcut(\"shift+f\", {"

if grep -q 'pi.registerShortcut("shift+f"' "$FILE" 2>/dev/null; then
    echo ""
    echo "   ✅ Shortcut is correctly set to 'shift+f'"
else
    echo ""
    echo "   ❌ Shortcut conflict still exists!"
    exit 1
fi

echo ""
echo "====================================="
echo "✅ All tests passed - Shortcut fixed!"
echo "====================================="
echo ""
echo "Testing steps:"
echo "  1. Press shift+f to open session search"
echo "  2. Verify no Ctrl+F conflict"
echo "  3. Press Ctrl+F for editor search"
echo ""
