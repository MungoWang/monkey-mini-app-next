/**
 * @exampleOf Input
 * @title Input
 * @scenario Plain single-line text bound to state; combine with Label/InputGroup rather than styling the native input.
 */
import { Input } from "@mohou/ui";

export default function Input01Example() {
  return <Input id="demo-name" placeholder="Ada" />;
}
