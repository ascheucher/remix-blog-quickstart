import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { marked } from "marked";
import {
  Form,
  useNavigation,
  useActionData,
  useLoaderData
} from "@remix-run/react";
import {
  createPost,
  getPost,
  updatePost,
  deletePost
} from "~/models/post.server";
import invariant from "tiny-invariant";


export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.slug, "params.slug is required");

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  const html = marked(post.markdown);
  return json({ html, post });
}

export const action = async ({ request }: ActionArgs) => {

  const oldSlug = request.params.slug

  const formData = await request.formData();

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };
  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );
  if (hasErrors) {
    return json(errors)
  }

  invariant(
    typeof title === "string",
    "title must be a string"
  );
  invariant(
    typeof slug === "string",
    "slug must be a string"
  );
  invariant(
    typeof markdown === "string",
    "markdown must be a string"
  );

  if (slug !== oldSlug) {
    await deletePost(oldSlug);
    await createPost({ title, slug, markdown });
  }
  await updatePost(slug, { title, markdown });

  // TODO: remove me
  await new Promise((res) => setTimeout(res, 1000));

  return redirect("/posts/admin");
}

export default function NewPost() {
  const inputClassName =
    "w-full rounded border border-gray-500 px-2 py-1 text-lg";

  const { html, post } = useLoaderData<typeof loader>()

  const oldSlug = post.slug
  const errors = useActionData<typeof action>()

  const navigation = useNavigation()
  const isCreating = Boolean(
    navigation.state === "submitting"
  );

  return (
    <Form method="post">
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={post.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{" "}
          {errors?.slug ? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={post.slug}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown:{" "}
          {errors?.markdown ? (
            <em className="text-red-600">
              {errors.markdown}
            </em>
          ) : null}
        </label>
        <br />
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={post.markdown}
          onChange={(e) => { console.log(e) }}
        />
      </p>
      <p className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Update Post"}
        </button>
      </p>
    </Form>
  );
}
