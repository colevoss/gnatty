export interface IActionParams {
  // Name of the subject
  name: string;

  // Specific name of a group
  group?: string;

  // Use the class name as a group
  useGroup?: boolean;

  // Use the action name as the group name
  useNameAsGroup?: boolean;
}
