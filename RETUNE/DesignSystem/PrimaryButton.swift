import SwiftUI

struct PrimaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundStyle(Color.black)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(RETuneTheme.accent)
                        .shadow(color: RETuneTheme.accent.opacity(0.28), radius: 18, y: 6)
                )
        }
        .buttonStyle(.plain)
    }
}
