T = int(input())  # 테스트 케이스 개수 입력

for tc in range(1, 1 + T):
    N = int(input())  # 격자 크기 N 입력 (N x N)

    # 격자 상태 입력 (0: 빈 공간, 1: 기둥, 2: 경비병)
    position = [list(map(int, input().split())) for _ in range(N)]

    # 상, 하, 좌, 우 방향을 나타내는 좌표 변화량 리스트
    dx = [1, -1, 0, 0]
    dy = [0, 0, 1, -1]
    
    # 1. 격자 전체를 순회하며 경비병(2) 찾기
    for y in range(N):
        for x in range(N):
            # 현재 위치가 경비병(2)이라면
            if position[y][x] == 2:
                # 2. 기지국을 중심으로 4방향 탐색
                for idx in range(4):
                    # 3. 각 방향으로 1칸부터 N-1칸까지 멀어지며 신호 전달
                    for z in range(1, N):
                        # 다음에 확인할 좌표 계산 (현재좌표 + 방향*거리)
                        nx = x + (dx[idx] * z)
                        ny = y + (dy[idx] * z)
                        
                        # 격자 범위 내에 있는지 확인
                        if 0 <= nx < N and 0 <= ny < N:
                            # 만약 기둥(1)을 만나면 해당 방향으로는 감지 못함
                            if position[ny][nx] == 1:
                                break
                            # 빈 공간(0)이면(1로 변경)
                            else:
                                position[ny][nx] = 1
                        else:
                            # 격자 밖으로 나가면 해당 방향 탐색 종료
                            break
    
    # 4. 신호가 전달되지 않은 사각지대(0) 개수 세기
    result = 0                      
    for y in range(N):
        for x in range(N):
            if position[y][x] == 0:
                result += 1
    
    # 결과 출력: #테스트케이스번호 결과값
    print(f'#{tc} {result}')