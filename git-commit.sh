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

# Commit with the provided message and store the commit hash
if [[ -n "$message" ]]; then
    git commit -m "$message"
    commit_hash=$(git rev-parse --short=7 HEAD)
    echo "Changes committed successfully!"
    echo "Commit hash: $commit_hash"
    
    # Push changes
    echo "Pushing changes to remote..."
    git push
    if [ $? -eq 0 ]; then
        echo "Changes pushed successfully!"
    else
        echo "Failed to push changes. Please push manually."
    fi
else
    echo "Commit message cannot be empty"  
    git reset
fi