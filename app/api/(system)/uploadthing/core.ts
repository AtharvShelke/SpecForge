import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { authenticateRequest } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/request";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      try {
        assertTrustedOrigin(req);
        enforceRateLimit(req, "upload");

        const user = await authenticateRequest(req);
        if (!user || user.role !== "ADMIN") {
          throw new UploadThingError("Unauthorized");
        }

        return { userId: user.id };
      } catch (error) {
        if (error instanceof UploadThingError) {
          throw error;
        }
        throw new UploadThingError(
          error instanceof Error ? error.message : "Upload blocked"
        );
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.ufsUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
