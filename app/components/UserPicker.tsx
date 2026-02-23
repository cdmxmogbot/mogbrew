import { CREW, CREW_COLORS } from "~/lib/crew";
import { useUser } from "~/lib/user-context";
import { Button } from "~/components/ui/button";

export function UserPicker() {
  const { setUser } = useUser();

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-2">🍺 MOGBREW</h1>
      <p className="text-zinc-400 mb-8 text-lg">Who's drinking?</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {CREW.map((member) => (
          <Button
            key={member.id}
            variant="outline"
            className="h-20 text-2xl flex items-center justify-center gap-3 bg-zinc-900 border-zinc-700 hover:border-2"
            style={{
              borderColor: CREW_COLORS[member.id],
              ["--hover-border" as any]: CREW_COLORS[member.id],
            }}
            onClick={() => setUser(member)}
          >
            <span className="text-3xl">{member.emoji}</span>
            <span>{member.name}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function UserChip() {
  const { user, setShowPicker } = useUser();

  if (!user) return null;

  return (
    <button
      onClick={() => setShowPicker(true)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
      style={{ borderColor: CREW_COLORS[user.id], borderWidth: 2 }}
    >
      <span className="text-lg">{user.emoji}</span>
      <span className="text-sm font-medium">{user.name}</span>
    </button>
  );
}
