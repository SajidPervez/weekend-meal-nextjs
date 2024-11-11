#!/bin/bash

# Check if there are any changes
echo "Checking git status..."
if [[ -z $(git status -s) ]]; then
    echo "No changes to commit"
    exit 0
fi

# Show current changes
git status

# Prompt for confirmation to proceed
read -p "Do you want to stage these changes? (y/n): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Operation cancelled"
    exit 0
fi

# Add all changes
echo "Adding changes..."
git add .

# Request commit message
read -p "Enter commit message: " message

# Commit with the provided message
if [[ -n "$message" ]]; then
    git commit -m "$message"
    echo "Changes committed successfully!"
else
    echo "Commit message cannot be empty"
    git reset
fi