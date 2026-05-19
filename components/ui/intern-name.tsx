/**
 * Renders an intern's full name with distinct font weights:
 * first name — weight 200 (light), last name — weight 400 (normal).
 *
 * Assumes the last word is the last name and everything before it is the first name.
 * If the name is a single word it is rendered at weight 400.
 */
export function InternName({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);

  if (parts.length <= 1) {
    return <span style={{ fontWeight: 400 }}>{name}</span>;
  }

  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");

  return (
    <span>
      <span style={{ fontWeight: 200 }}>{firstName}</span>
      {" "}
      <span style={{ fontWeight: 400 }}>{lastName}</span>
    </span>
  );
}
