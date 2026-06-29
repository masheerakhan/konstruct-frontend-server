import os

filepath = r'c:\VIBE COPILOT\Konstruct\FE-Konstruct\src\components\QHSE\InspectionChecklists\inspectionChecklistApi.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    '/**\n * Fetch all QHSE Inspection Checklist templates for a given project.\n */': 
        '// QHSE:\n// Loads checklist templates from QHSEMicroService (8004).\n// Triggered when Folder 22 Checklist Library opens.\n/**\n * Fetch all QHSE Inspection Checklist templates for a given project.\n */',
        
    '/**\n * Create a new checklist template\n */':
        '// QHSE:\n// Creates a new checklist template.\n// Used by "Create Checklist Template" button inside Folder 22.\n/**\n * Create a new checklist template\n */',
        
    '/**\n * Create a new checklist instance\n */':
        '// QHSE:\n// Creates a new checklist instance.\n// Initializes the workflow state on QHSEMicroService (8004).\n/**\n * Create a new checklist instance\n */',
        
    '/**\n * Submit Maker responses\n */':
        '// QHSE:\n// Submits Maker responses and signature.\n// Transitions workflow from Draft -> Pending Checker.\n/**\n * Submit Maker responses\n */',
        
    '/**\n * Approve checklist\n */':
        '// QHSE:\n// Checker approval action.\n// Transitions workflow from Pending Checker -> Pending Supervisor.\n// Supervisor approval action.\n// Final workflow step. Transitions checklist to Completed status.\n/**\n * Approve checklist\n */',
        
    '/**\n * Reject checklist\n */':
        '// QHSE:\n// Checker/Supervisor rejection action.\n// Transitions workflow backwards, returning to the Maker for rework.\n/**\n * Reject checklist\n */',
        
    '/**\n * Download signed PDF\n */':
        '// QHSE:\n// Generates signed PDF report.\n// Includes Maker, Checker and Supervisor signatures.\n/**\n * Download signed PDF\n */'
}

for target, repl in replacements.items():
    if repl not in content:
        content = content.replace(target, repl)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Added function comments to inspectionChecklistApi.js')
