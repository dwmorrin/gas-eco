import { createElement } from "../HTML";

export default function SignOutButton({ student, handleStudent }) {
  return createElement("button", {
    textContent: "Sign Out",
    onClick: () => handleStudent(student),
  });
}
