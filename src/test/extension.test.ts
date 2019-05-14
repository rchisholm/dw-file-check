//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as dwUtil from '../dw-utils';
import * as dwFunc from '../dw-functions';
import * as dwStat from '../dw-status';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as myExtension from '../extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function() {

    test("should pass", function() {
        assert(true);
    });

    test("sample dir is folder", function() {
        if(vscode.workspace.rootPath) {
            assert(dwUtil.isFolder(vscode.workspace.rootPath));
        }else {
            assert(false);
        }
    });

    test("sample file is not a folder", function() {
        if(vscode.workspace.rootPath) {
            assert(!dwUtil.isFolder(vscode.workspace.rootPath + "/checked-out.txt"));
        }else {
            assert(false);
        }
    });

    test("file is read-only", function() {
        if(vscode.workspace.rootPath) {
            assert(dwUtil.isReadOnly(vscode.workspace.rootPath + "/checked-in.txt"));
        }else {
            assert(false);
        }
    });

    test("file is checked out", async function() {
        if(vscode.workspace.rootPath) {
            let status = await dwStat.getFileStatusByPath(vscode.workspace.rootPath + "/checked-out.txt");
            assert.equal(status, "out");
        }else {
            assert(false);
        }
    });

    test("file is checked in", async function() {
        if(vscode.workspace.rootPath) {
            let status = await dwStat.getFileStatusByPath(vscode.workspace.rootPath + "/checked-in.txt");
            assert.equal(status, "locked");
        }else {
            assert(false);
        }
    });

    test("file is owned by rchisholm", async function() {
        if(vscode.workspace.rootPath) {
            let owner = await dwStat.getFileOwnerByPath(vscode.workspace.rootPath + "/checked-out.txt");
            assert.equal(owner, "rchisholm");
        }else {
            assert(false);
        }
    });

});