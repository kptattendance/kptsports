import RoleProtected from "../components/RoleProtected";

export default function CollegeLayout({
  children,
}) {
  return (
    <RoleProtected
      allowedRoles={["college_coordinator"]}
    >
      {children}
    </RoleProtected>
  );
}