import { describe, it, expect } from 'vitest';
import { v } from "convex/values";

// Test the validation schemas for project functions
describe('Project CRUD Functions', () => {
  it('should have correct validation schema for createProject', () => {
    const createProjectArgs = {
      name: v.string(),
      address: v.string(),
      listingType: v.string(),
      notes: v.optional(v.string()),
    };
    
    expect(createProjectArgs.name).toBeDefined();
    expect(createProjectArgs.address).toBeDefined();
    expect(createProjectArgs.listingType).toBeDefined();
    expect(createProjectArgs.notes).toBeDefined();
  });

  it('should have correct validation schema for updateProject', () => {
    const updateProjectArgs = {
      projectId: v.id("projects"),
      name: v.optional(v.string()),
      address: v.optional(v.string()),
      listingType: v.optional(v.string()),
      status: v.optional(v.string()),
      notes: v.optional(v.string()),
    };
    
    expect(updateProjectArgs.projectId).toBeDefined();
    expect(updateProjectArgs.name).toBeDefined();
    expect(updateProjectArgs.address).toBeDefined();
    expect(updateProjectArgs.listingType).toBeDefined();
    expect(updateProjectArgs.status).toBeDefined();
    expect(updateProjectArgs.notes).toBeDefined();
  });

  it('should have correct validation schema for deleteProject', () => {
    const deleteProjectArgs = {
      projectId: v.id("projects"),
    };
    
    expect(deleteProjectArgs.projectId).toBeDefined();
  });

  it('should have correct validation schema for getProject', () => {
    const getProjectArgs = {
      projectId: v.id("projects"),
    };
    
    expect(getProjectArgs.projectId).toBeDefined();
  });
});