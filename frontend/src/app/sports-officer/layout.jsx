import RoleProtected from "../components/RoleProtected";

export default function SportsOfficerLayout({
  children,
}) {
  return (
    <RoleProtected
      allowedRoles={["sports_officer"]}
    >
      {children}
    </RoleProtected>
  );
}