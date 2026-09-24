import assert from "node:assert/strict";
import { canAccessRoute, getRoleHome, isUserRole, ROLE_LABELS } from "../src/lib/roles.ts";

const CUSTOMER_PATHS = [
  "/", "/about-us", "/catering", "/catering/buffet", "/catering/packed",
  "/function-rooms", "/function-rooms/reserve", "/inquiries",
  "/delivery", "/delivery/order", "/profile",
];
const STAFF_PATHS = ["/operations", "/delivery/staff", "/delivery/items"];

const ROLE_CASES: [string, { role: unknown } | null, string[], string[]][] = [
  ["front_of_house", { role: "front_of_house" }, STAFF_PATHS, ["/dashboard", "/delivery/rider", "/"]],
  ["restaurant_manager", { role: "restaurant_manager" }, STAFF_PATHS, ["/dashboard", "/delivery/rider"]],
  ["system_admin", { role: "system_admin" }, ["/dashboard"], [...STAFF_PATHS, "/delivery/rider", "/"]],
  ["delivery_rider", { role: "delivery_rider" }, ["/delivery/rider"], [...STAFF_PATHS, "/dashboard", "/"]],
  ["customer", { role: "customer" }, CUSTOMER_PATHS, [...STAFF_PATHS, "/dashboard", "/delivery/rider"]],
  ["unauthenticated", null, CUSTOMER_PATHS, [...STAFF_PATHS, "/dashboard", "/delivery/rider"]],
  ["invalid role", { role: "admin" }, [], [...CUSTOMER_PATHS, ...STAFF_PATHS, "/dashboard", "/delivery/rider"]],
  ["missing role", { role: undefined }, [], [...CUSTOMER_PATHS, "/dashboard"]],
];

let checks = 0;
for (const [label, account, allowed, denied] of ROLE_CASES) {
  for (const path of allowed) {
    assert.ok(canAccessRoute(account, path), `${label} should access ${path}`);
    checks++;
  }
  for (const path of denied) {
    assert.ok(!canAccessRoute(account, path), `${label} should NOT access ${path}`);
    checks++;
  }
}

for (const role of Object.keys(ROLE_LABELS)) {
  assert.ok(getRoleHome(role));
}
assert.equal(getRoleHome("system_admin"), "/dashboard");
assert.equal(getRoleHome("delivery_rider"), "/delivery/rider");
assert.equal(getRoleHome("front_of_house"), "/operations");
assert.equal(getRoleHome("restaurant_manager"), "/operations");
assert.equal(getRoleHome("unknown"), null);
assert.ok(isUserRole("customer"));
assert.ok(!isUserRole("admin"));
checks += 8;

console.log(`roles test passed: ${checks} checks`);
