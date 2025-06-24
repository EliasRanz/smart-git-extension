// This file contains type definitions for the VS Code Git extension API.
// It's a simplified version of the one from @types/vscode.
// You would typically get this from installing the full types.

import { Uri, SourceControl, Event, CancellationToken, ProviderResult, WorkspaceFolder, Disposable } from 'vscode';

export interface GitExtension {
    readonly enabled: boolean;
    readonly onDidChangeEnablement: Event<boolean>;
    getAPI(version: 1): API;
}

export interface API {
    readonly git: Git;
    readonly repositories: Repository[];
    readonly onDidOpenRepository: Event<Repository>;
    readonly onDidCloseRepository: Event<Repository>;
    readonly onDidPublish: Event<PublishEvent>;
    readonly state: 'uninitialized' | 'initialized';
    readonly onDidChangeState: Event<'uninitialized' | 'initialized'>;
    readonly onDidChangeGitState: Event<GitState>;
    readonly onDidPush: Event<PushEvent>;
    readonly onDidReceivePush: Event<PushEvent>;
}

export interface GitState {
    readonly HEAD: Branch | undefined;
    readonly remotes: Remote[];
    readonly submodules: Submodule[];
    readonly rebaseCommit: Commit | undefined;
    readonly mergeChanges: Change[];
    readonly indexChanges: Change[];
    readonly workingTreeChanges: Change[];
    readonly untrackedChanges: Change[];
    readonly onDidChange: Event<void>;
}

export interface Repository {
    readonly rootUri: Uri;
    readonly inputBox: InputBox;
    readonly head: Branch | undefined;
    readonly state: GitState;
    readonly createBranch: (name: string, checkout: boolean, ref?: string) => Promise<void>;
    readonly deleteBranch: (name: string, force?: boolean) => Promise<void>;
    readonly getBranch: (name: string) => Promise<Branch>;
    readonly getBranches: (query: string) => Promise<Branch[]>;
    readonly getCommit: (ref: string) => Promise<Commit>;
    readonly push: (remoteName?: string, branchName?: string, setUpstream?: boolean) => Promise<void>;
    readonly commit: (message: string, opts?: { amend?: boolean }) => Promise<void>;
    readonly add: (paths: Uri[]) => Promise<void>;
    readonly revert: (paths: Uri[]) => Promise<void>;
}

export interface InputBox {
    value: string;
}

export interface Change {
    readonly uri: Uri;
    readonly originalUri: Uri;
    readonly renameUri: Uri | undefined;
    readonly status: Status;
}

export declare const enum Status {
    INDEX_MODIFIED = 0,
    INDEX_ADDED = 1,
    INDEX_DELETED = 2,
    INDEX_RENAMED = 3,
    INDEX_COPIED = 4,
    MODIFIED = 5,
    DELETED = 6,
    UNTRACKED = 7,
    IGNORED = 8,
    INTENT_TO_ADD = 9,
    BOTH_DELETED = 10,
    ADDED_BY_US = 11,
    DELETED_BY_THEM = 12,
    ADDED_BY_THEM = 13,
    DELETED_BY_US = 14,
    BOTH_ADDED = 15,
    BOTH_MODIFIED = 16
}


export interface Branch {
    readonly name?: string;
    readonly commit?: string;
    readonly upstream?: {
        readonly remote: string;
        readonly name: string;
    };
    readonly ahead?: number;
    readonly behind?: number;
}

export interface Commit {
    readonly hash: string;
    readonly message: string;
    readonly parents: string[];
    readonly authorDate?: Date;
    readonly authorName?: string;
    readonly authorEmail?: string;
    readonly commitDate?: Date;
    readonly commitName?: string;
    readonly commitEmail?: string;
}

export interface Remote {
    readonly name: string;
    readonly fetchUrl?: string;
    readonly pushUrl?: string;
    readonly isReadOnly: boolean;
}

export interface Submodule {
    readonly name: string;
    readonly path: string;
    readonly url: string;
}

export interface PublishEvent {
    readonly
    repository: Repository;
    readonly branch: Branch;
    readonly isToGithub: boolean;
}

export interface PushEvent {
    readonly repository: Repository;
    readonly branch: Branch;
    readonly isForce: boolean;
}
