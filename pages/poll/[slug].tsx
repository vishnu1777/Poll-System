// Import the generated Prisma client
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { toast } from "react-hot-toast";
import { addNewVote } from "../../lib/addNewVote";
import { checkForVote } from "../../lib/checkForVote";
import { addNewUpVote } from "../../lib/addNewUpvote";
import { checkForUpVote } from "../../lib/checkForUpvote";
import { Option, Poll } from "@prisma/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SiteFooter from "../../components/footer";

// Instantiate it
const prisma = new PrismaClient();

export type Props = {
  poll: Poll;
  options: Option[];
};

export async function getStaticPaths() {
  const polls = await prisma.poll.findMany({
    select: {
      id: true,
    },
  });

  return {
    paths: polls.map((poll) => ({
      params: {
        slug: poll.id,
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: any) {
  const poll = await prisma.poll.findUnique({
    where: {
      id: params.slug,
    },
  });
  const options = await prisma.option.findMany({
    where: {
      pollID: params.slug,
    },
  });

  if (poll) {
    return {
      props: {
        poll: JSON.parse(JSON.stringify(poll)),
        options: JSON.parse(JSON.stringify(options)),
      },
    };
  }

  return {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };
}

export default function PollPage(props: Props) {
  const router = useRouter();
  const [hasVoted, setHasVoted] = useState(false);
  const [hasUpVoted, setHasUpVoted] = useState(false);
  const [upvotes, setUpvotes] = useState(props?.poll.upvotes);
  useEffect(() => {
    setHasUpVoted(checkForUpVote(props.poll.id));
    setHasVoted(checkForVote(props.poll.id));
  }, [props.poll.id]);
  const addVote = (id: number, pollId: string) => {
    if (hasVoted !== true) {
      addNewVote(pollId);
      let toastId;
      toastId = toast.loading("Adding your vote...");
      try {
        axios.post("/api/vote", {
          id: id,
        });
        toast.success("Your vote has been added!", {
          id: toastId,
        });
        setHasVoted(true);
        router.push(`/poll/results/${pollId}`);
      } catch (error) {
        toast.error("Something went wrong...", {
          id: toastId,
        });
      }
    } else {
      toast.error("You have already voted for this poll!");
    }
  };

  const addUpVote = (pollId: string) => {
    if (hasUpVoted !== true) {
      addNewUpVote(pollId);
      let toastId;
      toastId = toast.loading("Adding your upvote...");
      try {
        axios.post("/api/upvote", {
          id: pollId,
        });
        toast.success("Your upvote has been added!", {
          id: toastId,
        });
        setUpvotes(upvotes + 1);
        setHasUpVoted(true);
      } catch (error) {
        toast.error("Something went wrong...", {
          id: toastId,
        });
      }
    } else {
      toast.error("You have already upvoted this poll!");
    }
  };
  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen p-3 font-mono relative">
      <div className="flex flex-col justify-center items-left w-full h-full lg:w-2/3 md:w-2/3 lg:h-2/3 p-2 gap-3">
        <h1 className="text-xl lg:text-2xl font-bold">
          {props?.poll.title}{" "}
          <span className="text-sm text-gray-500 underline decoration-dotted underline-offset-2">
            {props?.poll.visibility}
          </span>
        </h1>
        <div className="grid gap-3 grid-cols-2 w-full">
          {props?.options.map((option: Option) => {
            return (
              <button
                onClick={() => addVote(option.id, option.pollID)}
                className="flex duration-300 relative justify-between items-center rounded bg-green-300 hover:ring-2 ring-green-400 cursor-pointer px-4 py-2 w-full h-full shadow-md"
                key={option.id}
              >
                <span className="text-sm lg:text-md md:text-md font-mono font-bold">{option.number}.</span>
                <h2 className="text-sm lg:text-md md:text-md font-mono font-bold">{option.text}</h2>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {hasVoted === true && (
            <>
              <p
                className="text-gray-500 underline decoration-dotted underline-offset-2 cursor-pointer"
                onClick={() => router.push(`/poll/results/${props?.poll.id}`)}
              >
                view results
              </p>
              {" | "}
            </>
          )}
          <p
            className="cursor-pointer"
            onClick={() => addUpVote(props?.poll.id)}
          >
            {upvotes}△{" "}
            <span className="text-gray-500 underline decoration-dotted underline-offset-2">
              upvote
            </span>
          </p>
        </div>
        <p className="text-[0.8rem] lg:text-sm md:text-sm flex-wrap justify-center self-center items-center w-screen text-center absolute bottom-8 p-2">
          <span className="text-gray-500 underline decoration-dotted underline-offset-2">
            created by
          </span>{" "}
          {props?.poll.createdBy}
          {" | "}
          <span className="text-gray-500 underline decoration-dotted underline-offset-2">
            created on
          </span>{" "}
          {new Date(props?.poll.createdAt).toLocaleDateString()}{" "}
          {new Date(props?.poll.createdAt).toLocaleTimeString()}
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}