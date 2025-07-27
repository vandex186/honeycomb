#!/usr/bin/env node

// Test script for Gitpod host detection
const workspaceUrl = process.env.GITPOD_WORKSPACE_URL || '';

// Extract the hostname from Gitpod workspace URL
const getGitpodHost = () => {
  if (!workspaceUrl) return '';
  try {
    const url = new URL(workspaceUrl);
    return url.hostname;
  } catch {
    return workspaceUrl.replace(/https?:\/\//, '');
  }
};

const gitpodHost = getGitpodHost();
const isGitpod = !!process.env.GITPOD_WORKSPACE_URL;
const isDevelopment = process.env.NODE_ENV === 'development';

console.log('🔧 [GITPOD HOST TEST]');
console.log('=====================');
console.log(`Workspace URL: ${workspaceUrl || 'Not set'}`);
console.log(`Gitpod Host: ${gitpodHost || 'Not detected'}`);
console.log(`Is Gitpod: ${isGitpod}`);
console.log(`Is Development: ${isDevelopment}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);

if (isGitpod || isDevelopment) {
  console.log('✅ All hosts will be allowed (allowedHosts: true)');
} else {
  console.log('🔒 Restricted hosts will be used for security');
  console.log(`Allowed hosts: ${gitpodHost ? [gitpodHost, '*.gitpod.io', 'localhost', '127.0.0.1'] : ['*.gitpod.io', 'localhost', '127.0.0.1']}`);
}

console.log('\n💡 This should resolve the "Blocked request" error in Gitpod!'); 