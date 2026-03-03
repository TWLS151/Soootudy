# A형 2025 기출 - 면접 (시뮬레이션) 문제입니다.
# 제발 이렇게만 나와줬으면...
# 자세한 풀이 전략은 우리 반 노션 페이지 코드 란에 적어뒀습니다. 참고 부탁

T = int(input())

for tc in range(1, T+1):
    N, M, K = map(int, input().split())

    limit = N - (N//K)              # 포인터가 필요하지 않은 정답의 최대값

    if M <= limit:                  # 1. 정답 개수가 기준선보다 작거나 같으면 -> 포인터 사용 X
        print(f"#{tc} {M}")         # 정답 개수가 곧 점수

    else:
        pointer = M - limit         # 2. 최소 1회 이상 포인터 사용이 필요할 때
        score = 0                   # 3. 점수 계산

        for _ in range(pointer):
            score += K              # K 만큼 점수를 더하고
            score *= 2              # 포인터에 도달했을 때 점수 x 2
            M -= K                  # 맞힌 문제 수에서 K만큼 차감 (잔여 정답 수를 계산하기 위함)

        score += M

        print(f"#{tc} {score}")